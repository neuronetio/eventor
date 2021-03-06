if(typeof jest=="undefined"){

  jest={
    fn:function(){
      let _test={
        test:function _test(){}
      }
      spyOn(_test,'test');
      return _test.test;
    }
  }
  global.jasmineRequire = {
      interface: function() {}
  };
  require("jasmine-promises");

}
const Eventor = require("../");
const jsc=require("jscheck");


let valueSize = 50;

let eventNames = [];
for(let i = 0;i<valueSize;i++){
  let name=jsc.string(jsc.integer(1,100),jsc.character())();
  if(eventNames.indexOf(name)>=0){
    i--;
  }else{
    eventNames.push(name);
  }
}



let values = jsc.array(valueSize,jsc.any())();


describe("express-like eventNames",()=>{

  it("should have id param inside event.params",(done)=>{
    let eventor = Eventor();
    eventor.useBeforeAll("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useBefore("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.on("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useAfter("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.useAfterAll("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      expect(event.params.id).toEqual("10");
    });
    eventor.cascade("web-request:/user/10/create","someData").then((result)=>{
      return eventor.emit("web-request:/user/10/create","someData");
    }).then((results)=>{
      done();
    }).catch((e)=>{
      done.fail(e.message);
    })
  });


  it("should not match custom regex inside express-like routes",(done)=>{
    let eventor = Eventor();
    let count = 0;
    eventor.useBeforeAll("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      count++;
    });
    eventor.useBefore("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      count++;
    });
    eventor.on("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      count++;
    });
    eventor.useAfter("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      count++;
    });
    eventor.useAfterAll("%web-request:/user/:id(\\d+)/create",(data,event)=>{
      count++;
    });
    eventor.cascade("web-request:/user/test/create","someData").then((result)=>{
      expect(count).toEqual(0);
      return eventor.emit("web-request:/user/test/create","someData");
    }).then((results)=>{
      expect(count).toEqual(0);
      done();
    }).catch((e)=>{
      done.fail(e.message);
    })
  });

  it("should handle event names with dot delimeters",(done)=>{
    let eventor = Eventor();
    let count = 0;
    eventor.on("%system.:module.:action",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.params.action).toEqual("create");
      expect(event.matches[1]).toEqual("user");
      expect(event.matches[2]).toEqual("create");
    });
    eventor.on("%system.:module.create",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.matches[1]).toEqual("user");
    });
    eventor.on("%system.:module.(.*)",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.matches[1]).toEqual("user");
      expect(event.matches[2]).toEqual("create");
    });
    eventor.emit("system.user.create",{user:"data"}).then(()=>{
      expect(count).toEqual(3);
      done();
    })
  })

  it("should handle event names with dot delimeters and : sign",(done)=>{
    let eventor = Eventor();
    let count = 0;
    eventor.on("%system::module.:action",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.params.action).toEqual("create");
      expect(event.matches[1]).toEqual("user");
      expect(event.matches[2]).toEqual("create");
    });
    eventor.on("%system::module.create",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.matches[1]).toEqual("user");
    });
    eventor.on("%system::module.(.*)",(data,event)=>{
      count++;
      expect(event.params.module).toEqual("user");
      expect(event.matches[1]).toEqual("user");
      expect(event.matches[2]).toEqual("create");
    });
    eventor.emit("system:user.create",{user:"data"}).then(()=>{
      expect(count).toEqual(3);
      done();
    })
  })

  it("should not match synappse.start for %synappse.module.:name.initialize",(done)=>{
    let eventor = Eventor();
    let count = 0;
    let match = eventor.wildcardMatchEventName("%synappse.module.:name.initialize","synappse.start");
    expect(match.matches).toBeFalsy()
    eventor.on("%synappse.module.:name.initialize",(data,event)=>{
      count++;
    });
    eventor.cascade("synappse.start","data").then(()=>{
      expect(count).toEqual(0);
      done();
    })
  })

});
