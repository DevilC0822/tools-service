const apiResponse = (params) => {
  const { code = 200, data = null, msg = '', success = false } = params;
  return {
    ...params,
    code,
    data,
    msg,
    success,
  }
};