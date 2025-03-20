const computeRotation = iop => {
  if (iop === undefined) {
    return 0;
  }

  const rowDirection = iop.slice(0, 3);
  const columnDirection = iop.slice(3, 6);
  const mat = [
    [rowDirection[0], columnDirection[0]],
    [rowDirection[1], columnDirection[1]],
    [rowDirection[2], columnDirection[2]],
  ];
  // sin(t), cos(t)
  let angle = Math.atan2(-mat[0][1], mat[0][0]);
  // In degrees
  angle = angle * (180 / Math.PI);

  // The default rotation is 'horizontal' with the slide label on the right
  // Rotate clockwise by 90 degrees to have slide label at the top
  angle += 90;

  return angle;
};

export default computeRotation;
