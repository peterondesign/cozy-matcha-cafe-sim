// Transfer world-space deltas from the game's shared T-pose rig to Meshy's bind pose.
window.matchaPark.retargetHumanoid = function retargetHumanoid(THREE, source, target) {
  const position = name => target.getObjectByName(name)?.getWorldPosition(new THREE.Vector3());
  const leftFoot=position('LeftFoot'), leftToe=position('LeftToeBase');
  const rightFoot=position('RightFoot'), rightToe=position('RightToeBase');
  if (!leftFoot || !leftToe || !rightFoot || !rightToe) throw Error('Missing Meshy foot bones');
  const forward=leftToe.sub(leftFoot).add(rightToe.sub(rightFoot));
  target.rotation.y-=Math.atan2(forward.x,forward.z);
  const display=new THREE.Group();
  display.add(target);
  display.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(display,true);
  const height=bounds.max.y-bounds.min.y;
  if (!(height>.01)) throw Error('Invalid Meshy character bounds');
  const center=bounds.getCenter(new THREE.Vector3());
  const factor=1.44/height;
  target.scale.multiplyScalar(factor);
  target.position.multiplyScalar(factor).sub(new THREE.Vector3(center.x,bounds.min.y,center.z).multiplyScalar(factor));
  display.updateMatrixWorld(true);
  source.updateMatrixWorld(true);

  const left=position('LeftUpLeg'), right=position('RightUpLeg');
  if (!left || !right) throw Error('Missing Meshy leg bones');
  const destinationSide=Math.sign(right.x-left.x);
  const mapping=[];
  for (const side of ['Left','Right']) {
    const destination=left.x<right.x ? side : side==='Left'?'Right':'Left';
    for (const [from,to,end] of [['hip','UpLeg'],['knee','Leg'],['ankle','Foot'],['shoulder','Arm','ForeArm'],['elbow','ForeArm','Hand']]) {
      const driver=source.getObjectByName(from+side);
      const bone=target.getObjectByName(destination+to);
      if (!driver || !bone?.isBone) throw Error('Incompatible Meshy limb mapping');
      const axis=end && target.getObjectByName(destination+end)?.position.clone().normalize();
      mapping.push({driver,bone,axis,
        sourceBind:driver.getWorldQuaternion(new THREE.Quaternion()).invert(),
        targetBind:bone.getWorldQuaternion(new THREE.Quaternion())});
    }
  }

  const world=new THREE.Quaternion(), parentWorld=new THREE.Quaternion(), inverseFacing=new THREE.Quaternion();
  const sourceRotation=new THREE.Quaternion(), correction=new THREE.Quaternion();
  const direction=new THREE.Vector3(), aim=new THREE.Vector3();
  const pelvis=source.getObjectByName('pelvis');
  const spine=target.getObjectByName('Spine02');
  const head=target.getObjectByName('Head');
  if (head) head.scale.multiplyScalar(1.065);
  const toes=['LeftToeBase','RightToeBase'].map(name=>target.getObjectByName(name));
  const sole=new THREE.Vector3();
  const spineBind=spine?.quaternion.clone();
  const chestTurn=new THREE.Quaternion();
  const vertical=new THREE.Vector3(0,1,0);
  const neck=target.getObjectByName('neck');
  const neckBind=neck?.quaternion.clone();
  const rightWrist=target.getObjectByName('RightHand');
  const wristBind=rightWrist?.quaternion.clone();
  const waveArm=target.getObjectByName('RightArm'),waveForearm=target.getObjectByName('RightForeArm');
  const rotation=new THREE.Quaternion(), gestureEuler=new THREE.Euler();
  const spinePos=spine?.position.clone();
  function update(breath,wave,time,mode) {
    source.updateMatrixWorld(true);
    inverseFacing.copy(source.quaternion).invert();
    display.position.set(pelvis.position.x*Math.cos(source.rotation.y),pelvis.position.y,-pelvis.position.x*Math.sin(source.rotation.y));
    display.rotation.y=source.rotation.y;
    if (spine) {
      spine.position.copy(spinePos);
      spine.scale.y=1+breath*.021;
      spine.quaternion.copy(spineBind).multiply(rotation.setFromEuler(gestureEuler.set(
        breath*.035+(mode==='sit'?.085:0),-pelvis.rotation.y*.75,breath*.012)));
    }
    if (neck) neck.quaternion.copy(neckBind).multiply(rotation.setFromEuler(gestureEuler.set(
      -.025*breath,.04*Math.sin(time*.55),wave*.12)));
    if (rightWrist) rightWrist.quaternion.copy(wristBind);
    display.updateMatrixWorld(true);
    for (const {driver,bone,axis,sourceBind,targetBind} of mapping) {
      // Changing a parent alters the following joint's parent transform.
      bone.parent.getWorldQuaternion(parentWorld).invert();
      driver.getWorldQuaternion(sourceRotation);
      world.copy(sourceRotation).premultiply(inverseFacing).multiply(sourceBind).multiply(targetBind);
      world.premultiply(display.quaternion);
      if (axis) {
        // Aim along the shared arm pose despite differences in the generated bind stance.
        direction.copy(axis).applyQuaternion(world);
        aim.set(0,-1,0).applyQuaternion(sourceRotation);
        world.premultiply(correction.setFromUnitVectors(direction,aim));
      }
      if (wave && (bone===waveArm || bone===waveForearm)) {
        const rightSide=destinationSide*wave;
        const phaseAngle=time*10;
        const goal=bone===waveArm?new THREE.Vector3(rightSide*.83,-.18,.23):
          new THREE.Vector3(rightSide*(.12+.36*Math.sin(phaseAngle)),.97,.16);
        goal.normalize().applyQuaternion(display.quaternion);
        direction.copy(axis).applyQuaternion(world);
        correction.setFromUnitVectors(direction,goal);
        rotation.identity().slerp(correction,wave);
        world.premultiply(rotation);
      }
      world.premultiply(parentWorld);
      bone.quaternion.copy(world);
      bone.updateWorldMatrix(false,true);
    }
    if (mode==='sit' || mode==='rest') {
      display.updateMatrixWorld(true);
      const floor=Math.min(...toes.map(toe=>toe.getWorldPosition(sole).y));
      display.position.y+=.025-floor;
    }
    if (rightWrist && wave) rightWrist.quaternion.multiply(rotation.setFromEuler(
      gestureEuler.set(.12*wave,.35*wave,.42*Math.sin(time*10+.5)*wave)));
  }
  return {display,update};
};
