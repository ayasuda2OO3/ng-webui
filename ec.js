/*
 * Copyright (c) 2020 General Electric Company. All rights reserved.
 * The copyright to the computer software herein is the property of
 * General Electric Company. The software may be used and/or copied only
 * with the written permission of General Electric Company or in accordance
 * with the terms and conditions stipulated in the agreement/contract
 * under which the software has been supplied.
 *
 * author: apolo.yasuda@ge.com
 */

import Base from './base.js'

class EC extends Base {
  #sdk = "";
  #security = "";
  #releases = "";
  #features = "";
  #ngObj = new Map();
  #ngData = {};
  constructor(id,host,rev='v1.2beta',path='ec',api='api') {
      super();
      console.log(`EC id# ${id}`);
      this.appHost = host;
      this.appRev = rev;
      this.appPath = `/${this.appRev}/${path}`;
      this.apiPath = `/${this.appRev}/${path}/${api}`;
      this.appExit = `/${this.appRev}/${path}/exit`;
      this.appExec = `/${this.appRev}/${path}/exec`;
      this.appTerm = `/${this.appRev}/${path}/term`;
      this.appLog = `/${this.appRev}/${path}/log`;
      this.assetPath = `/${this.appRev}/assets`;    
  }
  
  attachWorker(f){
    this.worker = new SharedWorker(f); 
    this.worker.port.onmessage = (e)=>{
      console.log(`${e.data}`);
    }
    this.worker.port.postMessage(`wss://${location.host+this.appPath}/log`);
  }

  detachWorker(){
    this.worker.terminate();
  }

  Api(url,detail){
    return fetch(url,detail)
    .then(resp => resp.json());
  }
 
  TenguObjInit(){
    let _this=this;
    return this.TenguAPI('snapshot').then(d=>{
      for (const [key, data] of Object.entries(d)) {
        data['key']=key;
        if (!data.hasOwnProperty('name')){
          data['name']=key;
        }
        _this.#ngObj.set(key,data);           
      }
      return _this.#ngObj.keys();
    });
  }

  TenguDataInit(pkey){
    let pv = ec.TenguDataConversionI(pkey);
    this.#ngData = pv;
    
  }

  TenguDataConversionI(pk='root'){
    let pv = this.getNgObjVal(pk);
    
    if (pk=='root')
      pv={};
    
    if (pv==undefined)
      return {};
    
    pv["children"] = [];
    if (!pv.hasOwnProperty("name")) {
      pv["name"]=pk;
    }
   
    for (const [key, val] of this.#ngObj) {
      if (val["parent"]==pk) { 
         let _pv = this.TenguDataConversionI(key);
         pv["children"].push(_pv);
         continue
      }
      if ((val["parent"]==undefined||val["parent"]==''||val["parent"]=='self')&&pk=='root'){
         let _pv = this.TenguDataConversionI(key);
         pv["children"].push(_pv);
      }
    }

    if (pv["children"].length==0) {
      delete pv.children;
      if (!pv.hasOwnProperty("value")) {
        pv["value"]=10;
      }
    }
    return pv;
  }
  
  TenguDataConversionII(pk='', lvl=[]){
    let cArr=[],pArr=[];
    
    if (pk==undefined)
      return pArr;
   
    for (const [key, val] of this.#ngObj) {
      
      if (pk==''&&(!val['parent']||val['parent']==undefined||val['parent']=='self')) {              
              cArr=cArr.concat(this.TenguDataConversionII(key,lvl));
              let _val=JSON.parse(JSON.stringify(val));
              _val['id']=_val['name'];
              pArr.push(_val);
              continue
      }
    
      if (val["parent"]==pk) { 
         cArr=cArr.concat(this.TenguDataConversionII(key,lvl));
         let _val=JSON.parse(JSON.stringify(val));
         _val['id']=_val['name'];           
         _val['parents']=[this.getNgObjVal(pk).name];
         pArr.push(_val);
      }
    }
    if (cArr.length>0) {
      lvl.unshift(cArr);
    }
    return pArr;
  }

  TenguAPI(key,val='',mtd='GET'){
    let obj = this.GetTenguAPIObj(mtd),
        path=this.apiPath,
        _this=this;
    
    if (val!='') {
      obj.body=JSON.stringify(val);
    }
    
    if (key!='') path=`${path}/${key}`;
    return this.Api(path,obj).then(data=>{
      if (key!=''&&key!='snapshot') {
        switch(obj.method) {
          case 'DELETE':
             //_this.delNgObj(key);
             //break;          
          case 'PUT':
          case 'POST':
            //_this.setNgObj(data.key,data);
        }
      }
      
      return data;
    });
  }

  TenguSeederAPI(epath,mtd='GET'){
    let obj = this.GetTenguAPIObj(mtd);    
    return this.Api(epath,obj);
  }

  GetTenguToken(){
    return this.getToken('ec-config'); 
  }

  GetTenguAPIObj(mtd='GET'){
    let op = this.GetTenguToken();
    
    return {
      method: mtd,
      headers: {
        'Authorization': `Bearer ${op}`,
        'Content-Type': 'application/json'
      }
    };   
  }
     
  updateJsonNodeOps(aq,obj){  
    let sp = this.#ngData; 
    let lp = this.editor.get();

    obj.path.forEach((elm,idx)=>{
      if (sp&&sp['key']!=undefined&&
          lp&&lp['key']==sp['key']){
          obj.key=sp['key'];
          obj.value = this.cloneNgObjVal(lp);
      } else if (obj.path[idx-2]=='children'&&
         idx==obj.path.length-1){
          obj.method='POST'
          obj.value = this.cloneNgObjVal(lp);
          obj.value['parent']=sp['parent'];

          let op = obj.path.join('-');
          if (obj.value['name']!=undefined){
            op=obj.value['name'];
          }

          obj.key=op;
          
      } else if (obj.path[idx-1]=='children'&&
            idx==obj.path.length-1&&obj.method=='DELETE'){
          obj.key=sp[obj.path[idx]]['key'];
      }

      sp=(sp&&sp[elm]);
      lp=(lp&&lp[elm]);

    });

    aq[`${obj.key}-${obj.method}`]=obj;
  }

  Html(url){
    return fetch(url)
    .then(resp => resp.text());
  }

  cloneNgObjVal(obj){
    let _s = JSON.parse(JSON.stringify(obj));
    delete _s.children;
    //delete _s.audit;
    return _s;
  }

  getNgObjVal(k) {
    if (this.#ngObj.get(k)==undefined)
        return;
        
    let _k = JSON.parse(JSON.stringify(this.#ngObj.get(k)));
    return _k;
  }
  
  getNgObjArrByParentKey(k) {
    let arr=[];  
    for (const [key, val] of this.#ngObj) {
         if (val.parent==k){
              arr.push(val);
         }
    }
    return arr;
  }
        
  getNgObjByName(k) {
    for (let [key, elm] of this.#ngObj) {
      if (elm.name==k){
        return JSON.parse(JSON.stringify(elm));
      }
    }
  }
                        
  setNgObj(key,val) {
    let _val=this.getNgObjVal(key);
    if (_val&&_val.name&&_val.name=='browseHistory'){
      _val['list']&&(_val['list'][`${Date.now()}`]=val);
      this.#ngObj.set(key,_val);
      return;
    }
          
    this.#ngObj.set(key,val);
  }

  delNgObj(key) {
    this.#ngObj.delete(key);
  }
  
  get ngObjSize() {
    return this.#ngObj.size;
  }

  get ngData() {
    return this.#ngData;
  }

  set securityMd(c) {
    this.#security=c;
  }

  get securityMd() {
    return this.#security;
  }
    
  set featureHTML(c) {
    this.#features=c;
  }

  get featureHTML() {
    return this.#features;
  }

  set sdkInnerHTML(c) {
    this.#sdk=c;
  }

  get sdkInnerHTML() {
    return this.#sdk;
  }

  set Releases(c) {
    this.#releases=c;
  }

  get Releases() {
    return this.#releases;
  }
        
  timeStrConv(ms=Date.now()) {
    //yyyy-MM-ddThh:mm
    let currentdate = new Date(parseInt(ms)),
        mh = (currentdate.getMonth() + 1),
        dy = currentdate.getDate(),
        hr = currentdate.getHours(),
        mn = currentdate.getMinutes();
    
    return currentdate.getFullYear() + "-" + 
      (mh<10?'0'+mh.toString():mh) + "-" + 
      (dy<10?'0'+dy.toString():dy) + "T"+ (hr<10?'0'+hr.toString():hr) + 
      ":" + (mn<10?'0'+mn.toString():mn);
  }

}
export { EC as default };
