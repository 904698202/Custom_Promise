# Custom_Promise
模仿原生Promise的功能编写的Promise，功能基本实现
## 手写Promise

### 整体结构

主要采用ES5的方法定义Promise模块：

- 使用匿名函数自调用的方式，接收window为参数，并且将Promise构造函数暴露出去
- 定义构造函数Promise，在Promise内有resolve()和reject()方法
- 构造函数Promise接收一个excutor函数作为执行器，并且在函数内自调用
- 添加Promise原型对象上的方法then()、catch()（由Promise实例对象调用）
- 添加Promise函数对象上的方法resolve()、reject()、all([])、race([])（由Promise调用）

```js
(function(window){
  const PENDING = 'pending'
  const RESOLVED = 'resolved'
  const REJECTED = 'rejected'
  
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
  
    }
    // 当reject执行说明Promise返回失败结果
    function reject(error) {
   
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
  
  }

  /**
   * catch()
   * @param {function} onRejected 失败的回调
   * @returns {Promise}
   */
  Promise.prototype.catch = function (onRejected) {
 
  }

  /**
   * Promise函数对象上的方法：resolve()、reject()、all([])、race([])
   */
  /**
   * resolve()
   * @param {*} value 成功的值
   * @returns {Promise} 状态为Fulfilled，结果为value
   */
  Promise.resolve = function (value) {

  }

  /**
   * reject()
   * @param {*} error 失败的值 
   * @returns {Promise} 状态为Rejected，结果为error
   */
  Promise.reject = function (error) {
    
  }

  /**
   * all([])
   * @param {array} promises 一个由Promise对象组成的数组
   * @returns {Promise} 当所有Promise都执行成功时Promise状态为Fulfilled，如果有一个失败Promise的状态为Rejected
   */
  Promise.all = function (promises) {
    
  }

  /**
   * race()
   * @param {array} promises 一个由Promise对象组成的数组
   * @returns {Promise} 该Promise的结果由第一个完成的Promise决定
   */
  Promise.race = function (promises) {
    
  }

  // 向外暴露Promise函数
  window.Promise = Promise
})(window)
```

### 构造函数

编写思路：

- 定义四个变量_this、status、data、callbacks分别存放构造函数的this指向、Promise状态、传递的数据、处理Promise结果的回调函数
- 构造函数内的resolve()与reject()方法分别接收成功回调的value和失败回调的error，并且主要处理三件事：
  - 改变Promise状态
  - 存储传递的value或者error数据
  - 异步执行保存在回调函数数组内的对应的Promise回调函数（onResolved()或onRejected()），将数据传递到对应回调函数中。
- 在构造函数内直接执行excutor函数，捕获执行过程中抛出的错误，交给Promise内的reject()进行操作

注意点：

- Promise的状态只能改变一次，因此如果当前状态不是pending则直接结束resolve()\reject()的运行
- 因为Promise中的resolve()和reject()是异步执行自定义的回调函数，因此可以使用setTimeOut来将该回调函数放入setTimeOut执行队列中模拟异步队列中函数的执行

```js
  /**   * Promise构造函数   * @param {function} excutor 构造器函数(同步执行)   */  function Promise(excutor) {    // 将当前的Promise对象的this存起来以防后面函数调用时出现this指向错误    const _this = this    // 给Promise对象执行status属性，初始值为pending    _this.status = PENDING    // 给Promise对象指定一个用于存储结果数据的属性    _this.data = undefined     // 存放元素的结构：{onResolved() {}, onRejected() {}}    _this.callbacks = []    // 执行器由两个函数参数组成resolve()、reject()    // 当resolve执行说明Promise返回成功结果    function resolve(value) {      // 因为状态只能改变一次，所有如果当前状态不是pending直接结束      if (_this.status!==PENDING) return      // 1、将状态改为resolved      _this.status = RESOLVED      // 2、将value数据保存      _this.data = value      // 3、若有待执行的回调函数，立即异步执行onResolved      if (_this.callbacks.length>0) {        // 指定一个定时器可以将回调函数放入异步队列里面执行        setTimeout(() => {          _this.callbacks.forEach(callbacksObj => {            callbacksObj.onResolved(value)          })        }, 0);      }    }    // 当reject执行说明Promise返回失败结果    function reject(error) {      // 因为状态只能改变一次，所有如果当前状态不是pending直接结束      if (_this.status!==PENDING) return      // 1、将状态改为rejected      _this.status = REJECTED      // 2、将value数据保存      _this.data = error      // 3、若有待执行的回调函数，立即异步执行onRejected      if (_this.callbacks.length>0) {        // 指定一个定时器可以将回调函数放入异步队列里面执行        setTimeout(() => {          _this.callbacks.forEach(callbacksObj => {            callbacksObj.onRejected(error)          })        }, 0);      }    }    // 立即同步执行excutor    // 如果执行器抛出异常，状态也变成失败    try {      excutor(resolve,reject)    } catch (error) {      reject(error)    }  }
```

### then()\catch()

编写思路：

- then()方法接收两个自定义的回调函数对Promise的结果进行处理
- then()方法会对上一个实例对象的Promise的执行结果进行判断，并且进行处理：
  - 状态为pending时，将then()中自定义的两个回调函数放入Promise构造函数定义的回调数组callbacks中
  - 状态为resolved时，异步执行定义在onResolved()的回调函数
  - 状态为rejected时，异步执行定义在onRejected()的回调函数
- then()方法中定义在onResolved()和onRejected()输出结果有三种情况：
  - 直接return一个值时，此时return的值直接作为成功的Promise的结果交给Promise中的resolve(value)执行
  - throw一个异常时，此时的return的Promise即为失败的Pormise实例对象，将抛出的异常结果交给Promise中的reject(error)执行
  - return的值如果是一个Promise对象实例时，调用这个新的实例对象的then()方法，并且将这个实例对象的值传给resolve()和reject()进行调用
- catch()的实现可以看作是then()的onResolved()为undefined，可以将失败的回调交给此函数对象的then()方法来执行，逻辑一致

注意点：

- 当上一个Promise对象实例的状态为pending时，我们不直接将自定义在onResolved()和onRejected()上的函数直接放入待执行的回调函数数组中，而是调用其内部的resolve()\reject()去对要返回的一个新的Promise进行状态的更改
- 由于then()方法的onRejected()回调函数可能为空，此时我们也要把异常的信息传递下去（即实现异常传递），因此我们需要判断此回调函数是否存在
  - 不存在时将onRejected()默认设置为：`error => {throw error}`
- 当onResolved()不存在时（即实现catch()），我们就算不处理成功的数据时，也要将成功的值传递下去：`value => value`

```js
  /**   * Promise原型对象上的方法：then() catch()   */  /**   * then()   * @param {function} onResolved 成功的回调函数   * @param {function} onRejected 失败的回调函数   * @returns {Promise}   */  Promise.prototype.then = function (onResolved, onRejected) {    //如果不处理成功的，也要将成功的值传下去（如catch()）    onResolved = typeof onResolved === 'function' ? onResolved : value => value    //判断this的第二个回调是否有指定（实现异常传递）    onRejected = typeof onRejected === 'function' ? onRejected : error => {throw error}    const _this = this        return new Promise((resolve,reject) => {      /**       * 调用指定的回调函数进行处理，根据执行结果改变return的Promise的状态       * @param {function} callback        */      function handle(callback) {        //then有三种执行情况        try {          const result = callback(_this.data)          if (result instanceof Promise) {            // 如果回调函数返回new Promise，则return的值为这个Promise实例对象的结果            /*              result.then(                value => resolve(value),                error => reject(error)              )            */            //简洁写法：再次调用then方法，去执行新的Promise对象内的回调函数取得结果            //onResolved和onRejected为外部传来的回调函数，其返回值会自动传给resolve和reject的参数            result.then(resolve,reject)          } else {            // 如果回调函数直接return，则该return的值就是Promise成功的返回值value            resolve(result)          }        } catch (error) {          // 如果抛出异常，return的Promise则失败，data则为error          reject(error)        }      }      // 判断当前状态      if (_this.status === PENDING) {        // 1、当前状态是pending，将指定的回调函数放入callbacks保存        // 之所以不直接将回调函数传入数组，是因为还需要再次调用内部resolve和reject去更改Promise的状态        _this.callbacks.push({          onResolved () {            handle(onResolved)          },          onRejected () {            handle(onRejected)          }        })      } else if (_this.status === RESOLVED) {         // 2、当前状态如果是resolved，异步执行onResolved更改return的Promise的状态        setTimeout(() => {          handle(onResolved)        }, 0);      } else {        // 3、当前状态是rejected，异步执行onRejected更改return的Promise的状态        setTimeout(() => {          handle(onRejected)        }, 0);      }    })  }  /**   * catch()   * @param {function} onRejected 失败的回调   * @returns {Promise}   */  Promise.prototype.catch = function (onRejected) {    return this.then(undefined, onRejected)  }
```

### resolve()\reject()

编写思路：

- resolve()接收的值有两种情况：
  - 一般值：则返回一个成功的Promise，值为这个值
  - 一个成功或失败的Promise实例对象，返回的值为这个Promise的结果
- reject()一经调用，就会返回一个失败的Promise实例对象，值为reject()中接收到的error

```js
/**   * resolve()   * @param {*} value 成功的值   * @returns {Promise} 返回的Promise可能是成功也可能失败   */  Promise.resolve = function (value) {    return new Promise((resolve,reject) => {      if (value instanceof Promise) {        //当接收的value是一个Promise，则返回的value是该Promise的结果        value.then(resolve,reject)      } else {        //当接收的是一个值，直接返回一个成功的Promise，值为value        resolve(value)      }    })  }  /**   * reject()   * @param {*} error 失败的值    * @returns {Promise} 状态为Rejected，结果为error   * 一经调用永远返回一个失败的Promise   */  Promise.reject = function (error) {    return new Promise((resolve,reject)=>{      reject(error)    })  }
```

### all([])\race([])

编写思路：

- all()和race()都是接收一个由Promise对象组成的数组
- all()会保存数组中所有Promise对象的值，如果全部的Promise都是成功才会返回成功的一个Promise，该Promise的值为所传的所有Promise的结果数组
- race()同样返回一个Promise，而该Promise的结果由所传的所有Promise对象第一个执行完的结果决定，无论此结果是成功还是失败

注意点：

- 在all()和race()接收的数组中，可能有成功的值，这时这个值直接看作一个成功的Promise的结果，我们可以通过Promise.resolve()把这个值包装成一个Promise，省去了判断的过程
- all()的结果是否成功可以定义一个计数器，每次有成功的Promise触发then()方法后此计数器自增，再通过比较计数器与所传数组的长的可以判断all()的返回结果，匹配成功后将所保留的Promise的对象的值交给resolve()执行，去将新返回的Promise对象的状态改成满足态
- all()返回的数组值的结果的顺序应该与传入的Promise数组的顺序对应，如果在遍历后直接使用push()会使所得值与所传值的结果相反，因此可以使用数组下标的方式指定每个值所在的数组位置

```js
  /**   * all([])   * @param {array} promises 一个由Promise对象组成的数组   * @returns {Promise} 当所有Promise都执行成功时Promise状态为Fulfilled，如果有一个失败Promise的状态为Rejected   */  Promise.all = function (promises) {    // 用来保存所有成功的value的值，指定他的长度为promises的长度    const values = new Array(promises.length)    // 定义一个用来保存成功Promise的数量    let resolvedCount = 0    // 返回一个新的Promise    return new Promise((resolve,reject) => {      // 遍历Promises获取每个Promise的结果      promises.forEach((p,index) => {        // 注意：我们接收到的数组也可能是一个已经成功的值        //对于这种情况我们可以用判断，简便方法是直接将这个值包装成一个Promise        Promise.resolve(p).then(          // 当接收到的Promise是成功的，将成功的value保存在values中，计数器自增          value => {            // 注意如果直接用push()方法，那么我们values中的值会和promises中的结果相反            resolvedCount++            values[index] = value            // 根据成功的值和所传Promise的个数来判断            if (resolvedCount === promises.length) {              resolve(values)            }          },          error => {            reject(error)          }        )      })    })  }  /**   * race()   * @param {array} promises 一个由Promise对象组成的数组   * @returns {Promise} 该Promise的结果由第一个完成的Promise决定   */  Promise.race = function (promises) {    return new Promise((resolve,reject) => {      // 遍历Promises获取每个Promise的结果      promises.forEach((p) => {        Promise.resolve(p).then(          value => {            // 一旦有成功的，把return变成成功的Promise            resolve(value)          },          error => {            // 一旦有失败的，将return变成失败的Promise            reject(error)          }        )      })    })  }
```

### 自定义方法

resolveDelay()\rejectDelay()

编写思路：

- 与resolve()\reject方法相比，多接收一个参数，通过定时器，延迟将结果返回，可以用来测试all()和race()方法

```js
  /**   * resolveDelay()   * @param {*} value    * @param {*} time    * @returns {Promise} 返回的Promise对象在指定的时间后才确定结果   */  Promise.resolveDelay = function (value, time) {    return new Promise((resolve,reject) => {      setTimeout(() => {        if (value instanceof Promise) {          //当接收的value是一个Promise，则返回的value是该Promise的结果          value.then(resolve,reject)        } else {          //当接收的是一个值，直接返回一个成功的Promise，值为value          resolve(value)        }      }, time);    })  }  /**   * rejectDelay()   * @param {*} value    * @param {Number}} time    * @returns {Promise} 返回的Promise对象在制定的时间后才失败   */   Promise.rejectDelay = function (error, time) {    // 一经调用永远返回一个失败的Promise    return new Promise((resolve,reject)=>{      setTimeout(() => {        reject(error)      }, time);    })  }
```

