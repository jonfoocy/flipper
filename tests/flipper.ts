import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Flipper } from "../target/types/flipper";
import * as assert from "assert";
import { SystemProgram } from "@project-serum/anchor";

describe("flipper", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Flipper as Program<Flipper>;
  var testAccount: anchor.web3.Keypair;

  it("Creates a Flip Account", async () => {
    const switchAccount = anchor.web3.Keypair.generate();
    await program.methods.initialize().accounts({
      switchAccount: switchAccount.publicKey,
      user: provider.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .signers([switchAccount])
    .rpc();
    const baseAccount = await program.account.switchAccount.fetch(switchAccount.publicKey);
    console.log(`Initialised state: ${baseAccount.state}`);
    assert.ok(baseAccount.state);
    testAccount = switchAccount;
  });

  it("Flip it!", async () => {
    const baseAccount = testAccount;
    await program.methods.flip().accounts({
      switchAccount: baseAccount.publicKey
    })
    .rpc();

    const account = await program.account.switchAccount.fetch(baseAccount.publicKey);
    console.log(`Flipped state: ${account.state}`);
    assert.ok(account.state == false);
  })
});
