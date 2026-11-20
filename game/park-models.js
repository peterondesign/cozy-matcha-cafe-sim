window.matchaPark.residentGLB = {};

// Load the local renderer only when someone visits the park or the grocer.
let engineLoad;
window.matchaPark.loadEngine=function(){
  if(!engineLoad)engineLoad=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='vendor/three-r170.js';
    script.onload=()=>resolve(window.MatchaThree);
    script.onerror=()=>{engineLoad=null;script.remove();reject(new Error('The village renderer could not load.'))};
    document.head.append(script);
  });
  return engineLoad;
};
window.matchaPark.loadParkModels = async function loadParkModels() {
  const {GLTFLoader,clone}=await window.matchaPark.loadEngine();
  const loader=new GLTFLoader();
  const parse=async data=>{
    const bytes=Uint8Array.from(atob(data),character=>character.charCodeAt(0));
    return (await loader.parseAsync(bytes.buffer,'')).scene;
  };
  const loadResident=name=>new Promise((resolve,reject)=>{
    // A classic script also loads when the game is opened directly from disk.
    const script=document.createElement('script');
    script.src=`assets/resident-${name}.js`;
    script.onload=()=>resolve(window.matchaPark.residentGLB[name]);
    script.onerror=()=>reject(new Error(`Could not load resident model ${name}`));
    document.head.append(script);
  });
  const names=['barista','elder','rose','green','blue','copper'];
  const results=await Promise.allSettled(names.map(async name=>
    parse(name==='barista'?window.matchaPark.baristaGLB:await loadResident(name))));
  const templates=new Map();
  results.forEach((result,index)=>{
    const name=names[index];
    if (result.status==='fulfilled') templates.set(name,result.value);
    else console.warn(`Using local rig for ${name}`,result.reason);
  });
  const waiting=new Map();
  const modelFor=name=>{
    const template=templates.get(name);
    return template && clone(template);
  };
  modelFor.preload=name=>{
    if (templates.has(name)) return Promise.resolve();
    if (!waiting.has(name)) {
      waiting.set(name,loadResident(name).then(parse).then(scene=>templates.set(name,scene)).catch(error=>{
        console.warn('Could not load visiting character '+name,error);
        templates.set(name,templates.get('blue'));
      }));
    }
    return waiting.get(name);
  };
  modelFor.ready=name=>templates.has(name);
  return modelFor;
};
