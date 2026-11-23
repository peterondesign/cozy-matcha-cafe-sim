const Garden = (() => {
  const minute = 60000;
  const crops = [
    {id:'matcha', name:'Matcha Powder', family:'Tea shrub', verb:'Prune', minutes:290, interval:90, stages:['Seedling','Growing','Mature','Ready']},
    {id:'strawberries', name:'Strawberries', family:'Fruit crop', verb:'Water', minutes:90, interval:30, stages:['Seedling','Growing','Fruiting','Ready']},
    {id:'blueberries', name:'Blueberries', family:'Berry bush', verb:'Water', minutes:150, interval:60, stages:['Seedling','Growing','Fruiting','Ready']},
    {id:'honey', name:'Honey', family:'Apiary', verb:'Inspect hive', minutes:70, interval:0, stages:['Settling','Building','Full','Ready']}
  ];
  function plant(crop, time, fraction=0) {
    return {growthStart:time, growthDuration:crop.minutes*minute, careInterval:crop.interval*minute,
      nextCareAt:crop.interval ? time+crop.interval*minute : null, lastCareAt:time,
      anchor:time, grown:fraction*crop.minutes*minute, missedCareAt:null};
  }
  function inspect(bed, time) {
    const deadline=bed.nextCareAt===null ? Infinity : bed.nextCareAt+5*minute;
    const peak=bed.grown+Math.max(0,Math.min(time,deadline)-bed.anchor);
    const loss=Math.max(0,time-deadline-15*minute)*0.12;
    const ready=peak>=bed.growthDuration;
    const growth=ready ? bed.growthDuration : Math.max(peak*0.65,peak-loss);
    const growthProgress=Math.min(100,Math.floor(100*growth/bed.growthDuration));
    let status='healthy';
    if (ready) status='ready';
    else if (time>=deadline) status='missed';
    else if (bed.nextCareAt!==null && time>=bed.nextCareAt) status='available';
    else if (bed.nextCareAt!==null && bed.nextCareAt-time<=5*minute) status='approaching';
    const stage=ready ? 3 : growthProgress<25 ? 0 : growthProgress<55 ? 1 : 2;
    return {growth, growthProgress, stage, status, missedCareAt:status==='missed'?deadline:null};
  }
  function initial(crop,time,legacy) {
    const bed=plant(crop,time,({matcha:.88,strawberries:.62,blueberries:.92,honey:.4})[crop.id]);
    if (legacy && Number.isFinite(legacy.growthStart) && legacy.growthDuration>0) {
      bed.growthDuration=legacy.growthDuration;
      bed.growthStart=bed.anchor=legacy.growthStart;
      bed.grown=0;
      bed.lastCareAt=legacy.lastCareAt || bed.anchor;
      if(crop.interval) bed.nextCareAt=legacy.nextCareAt || time;
    } else if(crop.id==='strawberries') {
      bed.nextCareAt=time-17*minute;
      bed.lastCareAt=bed.nextCareAt-bed.careInterval;
    }
    return bed;
  }
  function tend(bed,time) {
    const view=inspect(bed,time);
    if (!['available','missed','approaching'].includes(view.status)) return false;
    Object.assign(bed,{grown:view.growth,anchor:time,lastCareAt:time,nextCareAt:time+bed.careInterval,missedCareAt:null});
    return true;
  }
  return {crops,minute,plant,inspect,initial,tend};
})();
