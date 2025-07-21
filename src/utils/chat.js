// src/utils/chat.js
export function makeChatId(idA, idB) {
  // sort the two IDs lexicographically, then join with an underscore
  return [idA, idB].sort((a, b) => a.localeCompare(b)).join("_");
}
