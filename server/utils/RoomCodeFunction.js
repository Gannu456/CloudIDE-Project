const generateRoomCode = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz";
  const segment = () => {
    let result = "";
    for (let i = 0; i < 3; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };
  return `${segment()}-${segment()}-${segment()}`;
};

module.exports = { generateRoomCode };