# eventor
async event emitter on steroids with
- waterfall(cascade = output of one event is input for the next one),
- "-before" "-after" middleware callbacks
- event namespaces (event grouping)
- wildcards\* (user.\*)

## examples

### emit

```javascript
let eventor = new Eventor();

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    resolve("test1");
  });
});

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    resolve("test2");
  });
});


eventor.emit("test",{someData:"someValue"}).then((results)=>{
    console.log(results); // -> ["test1","test2"]
  });
```


### waterfall / cascade

```javascript
let eventor = new Eventor();

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.one="first";
    resolve(data);
  });
});

eventor.on("test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.two="second";
    resolve(data);
  });
});


eventor.waterfall("test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",two:"second",someData:"someValue"}
});
```

### -before & -after (middleware)

```javascript
// work in progress
```

### namespace
```javascript
let eventor = new Eventor();

eventor.on("module1","test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.one="first";
    resolve(data);
  });
});

eventor.on("module2","test",(data)=>{
  return new Promise((resolve,reject)=>{
    data.two="second";
    resolve(data);
  });
});


eventor.waterfall("module1","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {one:"first",someData:"someValue"}
});

eventor.waterfall("module2","test",{someData:"someValue"}).then((result)=>{
    console.log(result); // -> {two:"second",someData:"someValue"}
});

eventor.emit("module1","test",{someData:"someValue"}).then((results)=>{
  console.log(results); // -> [{two:"second",someData:"someValue"}]
});

eventor.removeNameSpaceListeners("module1");


```
