/*
自定义Promise模块
使用ES5的方法：匿名函数自调用(IIFE)
*/
(function(window){
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'
  /**
   * Promise构造函数
   * @param {function} excutor 构造器函数(同步执行)
   */
  function Promise(excutor) {
    // 将当前的Promise对象的this存起来以防后面函数调用时出现this指向错误
    const _this = this
    // 给Promise对象执行status属性，初始值为pending
    _this.status = PENDING
    // 给Promise对象指定一个用于存储结果数据的属性
    _this.data = undefined
    // 存放元素的结构：{onResolved() {}, onRejected() {}}
    _this.callbacks = []

    // 执行器由两个函数参数组成resolve()、reject()
    // 当resolve执行说明Promise返回成功结果
    function resolve(value) {
      // 因为状态只能改变一次，所有如果当前状态不是pending直接结束
      if (_this.status!==PENDING) return
      // 1、将状态改为resolved
      _this.status = RESOLVED
      // 2、将value数据保存
      _this.data = value
      // 3、若有待执行的回调函数，立即异步执行onResolved
      if (_this.callbacks.length>0) {
        // 指定一个定时器可以将回调函数放入异步队列里面执行
        setTimeout(() => {
          _this.callbacks.forEach(callbacksObj => {
            callbacksObj.onResolved(value)
          })
        }, 0);
      }
    }
    // 当reject执行说明Promise返回失败结果
    function reject(error) {
      // 因为状态只能改变一次，所有如果当前状态不是pending直接结束
      if (_this.status!==PENDING) return
      // 1、将状态改为rejected
      _this.status = REJECTED
      // 2、将value数据保存
      _this.data = error
      // 3、若有待执行的回调函数，立即异步执行onRejected
      if (_this.callbacks.length>0) {
        // 指定一个定时器可以将回调函数放入异步队列里面执行
        setTimeout(() => {
          _this.callbacks.forEach(callbacksObj => {
            callbacksObj.onRejected(error)
          })
        }, 0);
      }
    }

    // 立即同步执行excutor
    // 如果执行器抛出异常，状态也变成失败
    try {
      excutor(resolve,reject)
    } catch (error) {
      reject(error)
    }
  }

  /**
   * Promise原型对象上的方法：then() catch()
   */
  /**
   * then()
   * @param {function} onResolved 成功的回调函数
   * @param {function} onRejected 失败的回调函数
   * @returns {Promise}
   */
  Promise.prototype.then = function (onResolved, onRejected) {
    //如果不处理成功的，也要将成功的值传下去（如catch()）
    onResolved = typeof onResolved === 'function' ? onResolved : value => value
    //判断this的第二个回调是否有指定（实现异常传递）
    onRejected = typeof onRejected === 'function' ? onRejected : error => {throw error}

    const _this = this

    return new Promise((resolve,reject) => {
      /**
       * 调用指定的回调函数进行处理，根据执行结果改变return的Promise的状态
       * @param {function} callback
       */
      function handle(callback) {
        //then有三种执行情况
        try {
          const result = callback(_this.data)
          if (result instanceof Promise) {
            // 如果回调函数返回new Promise，则return的值为这个Promise实例对象的结果
            /*
              result.then(
                value => resolve(value),
                error => reject(error)
              )
            */
            //简洁写法：再次调用then方法，去执行新的Promise对象内的回调函数取得结果
            //onResolved和onRejected为外部传来的回调函数，其返回值会自动传给resolve和reject的参数
            result.then(resolve,reject)
          } else {
            // 如果回调函数直接return，则该return的值就是Promise成功的返回值value
            resolve(result)
          }
        } catch (error) {
          // 如果抛出异常，return的Promise则失败，data则为error
          reject(error)
        }
      }

      // 判断当前状态
      if (_this.status === PENDING) {
        // 1、当前状态是pending，将指定的回调函数放入callbacks保存
        // 之所以不直接将回调函数传入数组，是因为还需要再次调用内部resolve和reject去更改Promise的状态
        _this.callbacks.push({
          onResolved () {
            handle(onResolved)
          },
          onRejected () {
            handle(onRejected)
          }
        })
      } else if (_this.status === RESOLVED) {
         // 2、当前状态如果是resolved，异步执行onResolved更改return的Promise的状态
        setTimeout(() => {
          handle(onResolved)
        }, 0);
      } else {
        // 3、当前状态是rejected，异步执行onRejected更改return的Promise的状态
        setTimeout(() => {
          handle(onRejected)
        }, 0);
      }
    })
  }

  /**
   * catch()
   * @param {function} onRejected 失败的回调
   * @returns {Promise}
   */
  Promise.prototype.catch = function (onRejected) {
    return this.then(undefined, onRejected)
  }

  /**
   * Promise函数对象上的方法：resolve()、reject()、all([])、race([])
   */
  /**
   * resolve()
   * @param {*} value 成功的值
   * @returns {Promise} 返回的Promise可能是成功也可能失败
   */
  Promise.resolve = function (value) {
    return new Promise((resolve,reject) => {
      if (value instanceof Promise) {
        //当接收的value是一个Promise，则返回的value是该Promise的结果
        value.then(resolve,reject)
      } else {
        //当接收的是一个值，直接返回一个成功的Promise，值为value
        resolve(value)
      }
    })
  }

  /**
   * reject()
   * @param {*} error 失败的值
   * @returns {Promise} 状态为Rejected，结果为error
   */
  Promise.reject = function (error) {
    // 一经调用永远返回一个失败的Promise
    return new Promise((resolve,reject)=>{
      reject(error)
    })
  }

  /**
   * all([])
   * @param {array} promises 一个由Promise对象组成的数组
   * @returns {Promise} 当所有Promise都执行成功时Promise状态为Fulfilled，如果有一个失败Promise的状态为Rejected
   */
  Promise.all = function (promises) {
    // 用来保存所有成功的value的值，指定他的长度为promises的长度
    const values = new Array(promises.length)
    // 定义一个用来保存成功Promise的数量
    let resolvedCount = 0
    // 返回一个新的Promise
    return new Promise((resolve,reject) => {
      // 遍历Promises获取每个Promise的结果
      promises.forEach((p,index) => {
        // 注意：我们接收到的数组也可能是一个已经成功的值
        //对于这种情况我们可以用判断，简便方法是直接将这个值包装成一个Promise
        Promise.resolve(p).then(
          // 当接收到的Promise是成功的，将成功的value保存在values中，计数器自增
          value => {
            // 注意如果直接用push()方法，那么我们values中的值会和promises中的结果相反
            resolvedCount++
            values[index] = value
            // 根据成功的值和所传Promise的个数来判断
            if (resolvedCount === promises.length) {
              resolve(values)
            }
          },
          error => {
            reject(error)
          }
        )
      })
    })
  }

  /**
   * race()
   * @param {array} promises 一个由Promise对象组成的数组
   * @returns {Promise} 该Promise的结果由第一个完成的Promise决定
   */
  Promise.race = function (promises) {
    return new Promise((resolve,reject) => {
      // 遍历Promises获取每个Promise的结果
      promises.forEach((p) => {
        Promise.resolve(p).then(
          value => {
            // 一旦有成功的，把return变成成功的Promise
            resolve(value)
          },
          error => {
            // 一旦有失败的，将return变成失败的Promise
            reject(error)
          }
        )
      })
    })
  }

  /**
   * resolveDelay()
   * @param {*} value
   * @param {*} time
   * @returns {Promise} 返回的Promise对象在指定的时间后才确定结果
   */
  Promise.resolveDelay = function (value, time) {
    return new Promise((resolve,reject) => {
      setTimeout(() => {
        if (value instanceof Promise) {
          //当接收的value是一个Promise，则返回的value是该Promise的结果
          value.then(resolve,reject)
        } else {
          //当接收的是一个值，直接返回一个成功的Promise，值为value
          resolve(value)
        }
      }, time);
    })
  }

  /**
   * rejectDelay()
   * @returns {Promise} 返回的Promise对象在制定的时间后才失败
   * @param error
   * @param time
   */
   Promise.rejectDelay = function (error, time) {
    // 一经调用永远返回一个失败的Promise
    return new Promise((resolve,reject)=>{
      setTimeout(() => {
        reject(error)
      }, time);
    })
  }

  // 向外暴露Promise函数
  window.Promise = Promise
})(window)
