import { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { Program, AnchorProvider, web3 } from "@project-serum/anchor";
import idl from "./idl.json";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  useWallet,
  WalletProvider,
  ConnectionProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";

import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

const wallets = [new PhantomWalletAdapter()];

const { Keypair, SystemProgram } = web3;
const switchAccount = Keypair.generate();
const programId = new PublicKey(idl.metadata.address);
const opts = { preFlightCommitment: "processed" };

function App() {
  const [value, setValue] = useState(null);
  const wallet = useWallet();

  async function getProvider() {
    const network = "http://127.0.0.1:8899";
    const connection = new Connection(network, opts.preFlightCommitment);
    const provider = new AnchorProvider(
      connection,
      wallet,
      opts.preFlightCommitment
    );
    return provider;
  }

  async function initialize() {
    const provider = await getProvider();
    const program = new Program(idl, programId, provider);
    try {
      await program.methods
        .initialize()
        .accounts({
          switchAccount: switchAccount.PublicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([switchAccount])
        .rpc();

      const account = await program.account.switchAccount.fetch(
        switchAccount.publicKey
      );
      console.log("dataAccount pub key: ", switchAccount.publicKey.toBase58());
      console.log("user pub key: ", provider.wallet.publicKey.toBase58());
      console.log("program id: ", SystemProgram.programId.toBase58());
      console.log("account: ", account);
      setValue(account.state.toString());
    } catch (err) {
      console.log(err);
    }
  }

  async function flip() {
    const provider = getProvider();
    const program = new Program(idl, programId, provider);
    await program.methods
      .flip()
      .accounts({
        switchAccount: switchAccount.publicKey,
      })
      .rpc();
    const account = await program.account.switchAccount.fetch(
      switchAccount.publicKey
    );
    setValue(account.state.toString());
  }

  if (!wallet.connected) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <WalletMultiButton />
      </div>
    );
  } else {
    return (
      <div className="App">
        <div>
          {!value && <button onClick={initialize}>Create a Switch</button>}
          {value && <button onClick={flip}>Flip the switch</button>}
          {value ? <h2>{value}</h2> : <h2>Please create the switch</h2>}
        </div>
      </div>
    );
  }
}

const AppWithProvider = () => (
  <ConnectionProvider endpoint="http://127.0.0.1:8899">
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);

export default AppWithProvider;
