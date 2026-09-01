"use strict";

const replacements = [
  [/—/g, "-"],
  [/✦|✧|✨|⭐|🌟/g, ""],
];

function sanitizeText(node) {
  if (!node || node.nodeType !== Node.TEXT_NODE) return;
  let value = node.nodeValue || "";
  for (const [pattern, replacement] of replacements) value = value.replace(pattern, replacement);
  if (value !== node.nodeValue) node.nodeValue = value;
}

function sanitizeTree(root) {
  if (root.nodeType === Node.TEXT_NODE) return sanitizeText(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) sanitizeText(node);
}

sanitizeTree(document.body);
new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === "characterData") sanitizeText(mutation.target);
    mutation.addedNodes.forEach(sanitizeTree);
  }
}).observe(document.body, {childList:true, subtree:true, characterData:true});
