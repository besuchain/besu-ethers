import * as ethers from 'ethers';
export * from 'ethers';
export * from './privateContract';
import * as privateProviders from './privateProvider';
import * as besuProviders from './besuProvider';
export declare const providers: {
    BesuProvider: typeof besuProviders.BesuProvider;
    PrivateJsonRpcProvider: typeof privateProviders.PrivateJsonRpcProvider;
    Provider: typeof ethers.ethers.providers.Provider;
    BaseProvider: typeof ethers.ethers.providers.BaseProvider;
    FallbackProvider: typeof ethers.ethers.providers.FallbackProvider;
    AlchemyProvider: typeof ethers.ethers.providers.AlchemyProvider;
    CloudflareProvider: typeof ethers.ethers.providers.CloudflareProvider;
    EtherscanProvider: typeof ethers.ethers.providers.EtherscanProvider;
    InfuraProvider: typeof ethers.ethers.providers.InfuraProvider;
    JsonRpcProvider: typeof ethers.ethers.providers.JsonRpcProvider;
    NodesmithProvider: typeof ethers.ethers.providers.NodesmithProvider;
    Web3Provider: typeof ethers.ethers.providers.Web3Provider;
    IpcProvider: typeof ethers.ethers.providers.IpcProvider;
    JsonRpcSigner: typeof ethers.ethers.providers.JsonRpcSigner;
    getNetwork: typeof ethers.ethers.providers.getNetwork;
    Formatter: typeof ethers.ethers.providers.Formatter;
};
import * as privateTransactions from './privateTransaction';
export * from './privateTransaction';
export * from './privacyGroup';
export declare const utils: {
    computeAddress(key: string | ArrayLike<number>): string;
    recoverAddress(digest: string | ArrayLike<number>, signature: import('@ethersproject/bytes').SignatureLike): string;
    serialize(
        transaction: privateTransactions.PrivateUnsignedTransaction,
        signature?: import('@ethersproject/bytes').SignatureLike,
    ): string;
    parse(rawTransaction: string | ArrayLike<number>): privateTransactions.PrivateTransaction;
    allowedTransactionKeys: {
        [key: string]: boolean;
    };
    RegEx: {
        ethereumAddress: RegExp;
        bytes: RegExp;
        bytes32: RegExp;
        bytes64: RegExp;
        transactionHash: RegExp;
        base64: RegExp;
    };
    encode(object: any): string;
    decode(data: string | ArrayLike<number>): any;
    arrayify(
        value: string | number | ArrayLike<number> | ethers.ethers.utils.Hexable,
        options?: import('@ethersproject/bytes').DataOptions,
    ): Uint8Array;
    hexlify(
        value: string | number | ArrayLike<number> | ethers.ethers.utils.Hexable,
        options?: import('@ethersproject/bytes').DataOptions,
    ): string;
    AbiCoder: typeof ethers.ethers.utils.AbiCoder;
    defaultAbiCoder: ethers.ethers.utils.AbiCoder;
    Fragment: typeof ethers.ethers.utils.Fragment;
    EventFragment: typeof ethers.ethers.utils.EventFragment;
    FunctionFragment: typeof ethers.ethers.utils.FunctionFragment;
    ParamType: typeof ethers.ethers.utils.ParamType;
    FormatTypes: {
        [name: string]: string;
    };
    Logger: typeof ethers.ethers.utils.Logger;
    RLP: typeof ethers.ethers.utils.RLP;
    fetchJson: typeof ethers.ethers.utils.fetchJson;
    poll: typeof ethers.ethers.utils.poll;
    checkProperties: typeof ethers.ethers.utils.checkProperties;
    deepCopy: typeof ethers.ethers.utils.deepCopy;
    defineReadOnly: typeof ethers.ethers.utils.defineReadOnly;
    getStatic: typeof ethers.ethers.utils.getStatic;
    resolveProperties: typeof ethers.ethers.utils.resolveProperties;
    shallowCopy: typeof ethers.ethers.utils.shallowCopy;
    concat: typeof ethers.ethers.utils.concat;
    stripZeros: typeof ethers.ethers.utils.stripZeros;
    zeroPad: typeof ethers.ethers.utils.zeroPad;
    defaultPath: "m/44'/60'/0'/0/0";
    HDNode: typeof ethers.ethers.utils.HDNode;
    SigningKey: typeof ethers.ethers.utils.SigningKey;
    Interface: typeof ethers.ethers.utils.Interface;
    base64: typeof ethers.ethers.utils.base64;
    isHexString: typeof ethers.ethers.utils.isHexString;
    hexStripZeros: typeof ethers.ethers.utils.hexStripZeros;
    hexValue: typeof ethers.ethers.utils.hexValue;
    hexZeroPad: typeof ethers.ethers.utils.hexZeroPad;
    hexDataLength: typeof ethers.ethers.utils.hexDataLength;
    hexDataSlice: typeof ethers.ethers.utils.hexDataSlice;
    nameprep: typeof ethers.ethers.utils.nameprep;
    _toEscapedUtf8String: typeof ethers.ethers.utils._toEscapedUtf8String;
    toUtf8Bytes: typeof ethers.ethers.utils.toUtf8Bytes;
    toUtf8CodePoints: typeof ethers.ethers.utils.toUtf8CodePoints;
    toUtf8String: typeof ethers.ethers.utils.toUtf8String;
    formatBytes32String: typeof ethers.ethers.utils.formatBytes32String;
    parseBytes32String: typeof ethers.ethers.utils.parseBytes32String;
    hashMessage: typeof ethers.ethers.utils.hashMessage;
    namehash: typeof ethers.ethers.utils.namehash;
    isValidName: typeof ethers.ethers.utils.isValidName;
    id: typeof ethers.ethers.utils.id;
    getAddress: typeof ethers.ethers.utils.getAddress;
    getIcapAddress: typeof ethers.ethers.utils.getIcapAddress;
    getContractAddress: typeof ethers.ethers.utils.getContractAddress;
    isAddress: typeof ethers.ethers.utils.isAddress;
    formatEther: typeof ethers.ethers.utils.formatEther;
    parseEther: typeof ethers.ethers.utils.parseEther;
    formatUnits: typeof ethers.ethers.utils.formatUnits;
    parseUnits: typeof ethers.ethers.utils.parseUnits;
    commify: typeof ethers.ethers.utils.commify;
    keccak256: typeof ethers.ethers.utils.keccak256;
    sha256: typeof ethers.ethers.utils.sha256;
    randomBytes: typeof ethers.ethers.utils.randomBytes;
    solidityPack: typeof ethers.ethers.utils.solidityPack;
    solidityKeccak256: typeof ethers.ethers.utils.solidityKeccak256;
    soliditySha256: typeof ethers.ethers.utils.soliditySha256;
    splitSignature: typeof ethers.ethers.utils.splitSignature;
    joinSignature: typeof ethers.ethers.utils.joinSignature;
    parseTransaction: typeof ethers.ethers.utils.parseTransaction;
    serializeTransaction: typeof ethers.ethers.utils.serializeTransaction;
    getJsonWalletAddress: typeof ethers.ethers.utils.getJsonWalletAddress;
    computePublicKey: typeof ethers.ethers.utils.computePublicKey;
    recoverPublicKey: typeof ethers.ethers.utils.recoverPublicKey;
    verifyMessage: typeof ethers.ethers.utils.verifyMessage;
    mnemonicToEntropy: typeof ethers.ethers.utils.mnemonicToEntropy;
    entropyToMnemonic: typeof ethers.ethers.utils.entropyToMnemonic;
    isValidMnemonic: typeof ethers.ethers.utils.isValidMnemonic;
    mnemonicToSeed: typeof ethers.ethers.utils.mnemonicToSeed;
    SupportedAlgorithms: typeof ethers.ethers.utils.SupportedAlgorithms;
    UnicodeNormalizationForm: typeof ethers.ethers.utils.UnicodeNormalizationForm;
    Indexed: typeof ethers.ethers.utils.Indexed;
};
export * from './privateWallet';
