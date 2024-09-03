const computeRotation = iop => {
  if (iop === undefined) {
    return 0;
  }

  const rowDirection = iop.slice(0, 3);
  const columnDirection = iop.slice(3, 6);
  const rotationMatrix = [
    [rowDirection[0], columnDirection[0]],
    [rowDirection[1], columnDirection[1]],
    [rowDirection[2], columnDirection[2]],
  ];
  let angle = Math.atan2(-rotationMatrix[0][0], rotationMatrix[0][1]);
  // In degrees
  angle = angle / (Math.PI / 180);

  return angle;
};

export default computeRotation;
