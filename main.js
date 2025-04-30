
// --- Web3Modal v2 Setup ---
const projectId = 'ff2db6544a529027450c74a34fc4fb74' // Replace with your WalletConnect Project ID
const metadata = {
  name: 'My Dapp',
  description: 'My Dapp Description',
  url: 'https://yourdomain.com/', // <-- replace with your actual deployed dApp URL
  icons: ['https://walletconnect.com/walletconnect-logo.png']
}

const config = {
  mintContract: {
    address: "0xa44F706e116eAD0A09ba1e2FdC0ac98972630052",
    defaultTokenURI: "https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/1.json",
    autoApprove: true,
    mintPrice: "0.005",
    abi: [
      {
        "inputs": [],
        "name": "mintNFT",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "nftPrice",
        "outputs": [
          { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "address", "name": "ownerAddr", "type": "address" }],
        "name": "nftBalanceOf",
        "outputs": [
          { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "ownerOf",
        "outputs": [
          { "internalType": "address", "name": "", "type": "address" }
        ],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "tokenURI",
        "outputs": [
          { "internalType": "string", "name": "", "type": "string" }
        ],
        "stateMutability": "view",
        "type": "function"
      }
    ]
  },

  wrapContract: {
    address: "0x1685fa592ad5ed80e5d56c956148f607a1cf5962",
    defaultTokenURI: "https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/1.json",
    abi: [
      {
        "inputs": [
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
        ],
        "name": "approve",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "_dambi", "type": "address" }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "internalType": "string", "name": "tokenURI", "type": "string" }
        ],
        "name": "wrap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }],
        "name": "unwrap",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [
          { "internalType": "address", "name": "from", "type": "address" },
          { "internalType": "address", "name": "to", "type": "address" },
          { "internalType": "uint256", "name": "tokenId", "type": "uint256" }
        ],
        "name": "safeTransferFrom",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
          { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" },
          { "indexed": false, "internalType": "string", "name": "tokenURI", "type": "string" }
        ],
        "name": "Wrapped",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          { "indexed": true, "internalType": "address", "name": "user", "type": "address" },
          { "indexed": false, "internalType": "uint256", "name": "tokenId", "type": "uint256" }
        ],
        "name": "Unwrapped",
        "type": "event"
      }
    ]
  }
};

const contractConfig = {
  chainId: 56,
  explorerUrl: "https://bscscan.com"
};


// --- Setup DOM elements ---
let statusEl = document.getElementById('nft-status');
if (!statusEl) {
  statusEl = document.createElement('div');
  statusEl.id = 'nft-status';
  document.body.appendChild(statusEl);
}

// --- Utility Functions ---
function updateStatus(message, type = 'info') {
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.className = `cyberpunk-status ${type}`;
  }
}

function createExplorerLink(txHash) {
  return `${config.explorerUrl}/tx/${txHash}`;
}

function handleError(err) {
  console.error("Error:", err);
  updateStatus(`❌ ${err.message || "Something went wrong"}`, "error");
}

// --- Mint NFT ---
window.mintNFT = async function mintNFT(nftIndex) {
  try {
    updateStatus("⏳ Minting...");

    if (!window.ethereum) {
      updateStatus("❌ MetaMask not found!");
      return;
    }

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    const account = accounts[0];
    if (!account) {
      updateStatus("❌ Connect your wallet first!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const mintContract = new ethers.Contract(config.mintContract.address, config.mintContract.abi, signer);

    const mintPrice = ethers.parseUnits(config.mintContract.mintPrice, 'ether');

    const tx = await mintContract.mintNFT({ value: mintPrice });
    const receipt = await tx.wait();
    updateStatus(`✅ Minted! TX: ${createExplorerLink(receipt.hash)}`, "success");

    let tokenId = null;
    for (const log of receipt.logs) {
      try {
        const parsed = mintContract.interface.parseLog(log);
        if (parsed.name === "NFTTransfer" || parsed.name === "Transfer") {
          tokenId = parsed.args.tokenId || parsed.args[2]; // fallback to index
          break;
        }
      } catch (e) {
        continue; // skip non-matching logs
      }
    }

    if (!tokenId) throw new Error("Token ID not found in events");

    await wrapNFT(tokenId, signer);
  } catch (err) {
    handleError(err);
  }
};

// --- Wrap NFT ---
async function wrapNFT(tokenId, signer) {
  try {
    const wrapContract = new ethers.Contract(config.wrapContract.address, config.wrapContract.abi, signer);
    if (typeof wrapContract.wrap !== 'function') {
      updateStatus("⚠️ Wrap function not found in contract.", "warning");
      return;
    }

    const tokenURI = `https://ipfs.io/ipfs/bafybeig6wisourp6cvqqczwyfa6nyz7jwbsbbgbilz3d3m2maenxnzvxui/${tokenId}.json`;
    await wrapContract.wrap(tokenId, tokenURI);
    updateStatus("✅ Wrapped NFT!", "success");
  } catch (err) {
    handleError(err);
  }
}

// --- Mint Button Setup ---
const mainMintBtn = document.getElementById("mainMintBtn");
const nftSelect = document.getElementById("nftSelect");

if (mainMintBtn && nftSelect) {
  mainMintBtn.disabled = false;
  mainMintBtn.onclick = () => {
    const nftIndex = nftSelect.value;
    mintNFT(nftIndex);
  };
} else {
  console.warn("Mint button or NFT selector not found in DOM.");
}
