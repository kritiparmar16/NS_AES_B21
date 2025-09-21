const enc = new TextEncoder();
const dec = new TextDecoder();

let aesKey;
let iv;
let encryptedData;

// Derive AES key from user-provided secret
async function getKey(secret) {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("fixedSaltValue"), // static salt for consistency
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

window.onload = () => {
  iv = crypto.getRandomValues(new Uint8Array(12));

  // Theme: apply saved or default
  const savedTheme = localStorage.getItem("theme") || "light";
  document.body.classList.remove("light", "dark");
  document.body.classList.add(savedTheme);
  document.getElementById("themeSwitcher").checked = savedTheme === "dark";
};

async function encryptText() {
  const secret = document.getElementById("secretKey").value.trim();
  if (!secret) {
    alert("Please enter a secret key!");
    return;
  }

  aesKey = await getKey(secret);

  const text = document.getElementById("inputText").value;
  const encoded = enc.encode(text);

  try {
    encryptedData = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encoded
    );

    const encryptedBase64 = btoa(String.fromCharCode(...new Uint8Array(encryptedData)));
    document.getElementById("encryptedOutput").innerText = "Encrypted:\n" + encryptedBase64;

    document.getElementById("decryptButton").style.display = "inline-block";
  } catch (error) {
    document.getElementById("encryptedOutput").innerText = "Encryption failed: " + error.message;
    document.getElementById("decryptButton").style.display = "none";
  }
}

async function decryptText() {
  const secret = document.getElementById("secretKey").value.trim();
  if (!secret) {
    alert("Please enter the same secret key used for encryption!");
    return;
  }

  aesKey = await getKey(secret);

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      aesKey,
      encryptedData
    );

    const decryptedText = dec.decode(decrypted);
    document.getElementById("decryptedOutput").innerText = "Decrypted:\n" + decryptedText;
  } catch (error) {
    document.getElementById("decryptedOutput").innerText = "Decryption failed: " + error.message;
  }
}

// Theme toggle
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeSwitcher");

  toggle.addEventListener("change", () => {
    const newTheme = toggle.checked ? "dark" : "light";
    document.body.classList.remove("light", "dark");
    document.body.classList.add(newTheme);
    localStorage.setItem("theme", newTheme);
  });
});
