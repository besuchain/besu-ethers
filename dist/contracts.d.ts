import { Fragment, Indexed, Interface, JsonFragment } from '@ethersproject/abi';
import {
    Block,
    BlockTag,
    Listener,
    Log,
    Provider,
    TransactionReceipt,
    TransactionRequest,
    TransactionResponse,
} from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber, BigNumberish } from '@ethersproject/bignumber';
import { UnsignedTransaction } from '@ethersproject/transactions';
export interface Overrides {
    gasLimit?: BigNumberish | Promise<BigNumberish>;
    gasPrice?: BigNumberish | Promise<BigNumberish>;
    nonce?: BigNumberish | Promise<BigNumberish>;
}
export interface PayableOverrides extends Overrides {
    value?: BigNumberish | Promise<BigNumberish>;
}
export interface CallOverrides extends PayableOverrides {
    blockTag?: BlockTag | Promise<BlockTag>;
    from?: string | Promise<string>;
}
export declare type ContractFunction = (...params: Array<any>) => Promise<any>;
export declare type EventFilter = {
    address?: string;
    topics?: Array<string>;
};
export interface Event extends Log {
    event?: string;
    eventSignature?: string;
    values?: Array<any>;
    decode?: (data: string, topics?: Array<string>) => any;
    removeListener: () => void;
    getBlock: () => Promise<Block>;
    getTransaction: () => Promise<TransactionResponse>;
    getTransactionReceipt: () => Promise<TransactionReceipt>;
}
export interface ContractReceipt extends TransactionReceipt {
    events?: Array<Event>;
}
export interface ContractTransaction extends TransactionResponse {
    wait(confirmations?: number): Promise<ContractReceipt>;
}
declare type RunFunction = (...params: Array<any>) => Promise<any>;
declare type RunOptions = {
    estimate?: boolean;
    callStatic?: boolean;
    payable?: boolean;
    transaction?: boolean;
};
interface Bucket<T> {
    [name: string]: T;
}
declare class RunningEvent {
    readonly tag: string;
    readonly filter: EventFilter;
    private _listeners;
    constructor(tag: string, filter: EventFilter);
    addListener(listener: Listener, once: boolean): void;
    removeListener(listener: Listener): void;
    removeAllListeners(): void;
    listeners(): Array<Listener>;
    listenerCount(): number;
    run(args: Array<any>): number;
    prepareEvent(event: Event): void;
}
export declare type ContractInterface = string | Array<Fragment | JsonFragment | string> | Interface;
export declare class Contract {
    readonly address: string;
    readonly interface: Interface;
    readonly signer: Signer;
    readonly provider: Provider;
    readonly functions: Bucket<ContractFunction>;
    readonly callStatic: Bucket<ContractFunction>;
    readonly estimate: Bucket<(...params: Array<any>) => Promise<BigNumber>>;
    readonly populateTransaction: Bucket<(...params: Array<any>) => Promise<UnsignedTransaction>>;
    readonly filters: Bucket<(...params: Array<any>) => EventFilter>;
    readonly [name: string]: ContractFunction | any;
    readonly addressPromise: Promise<string>;
    readonly deployTransaction: TransactionResponse;
    private _deployedPromise;
    private _runningEvents;
    private _wrappedEmits;
    constructor(
        addressOrName: string,
        contractInterface: ContractInterface,
        signerOrProvider: Signer | Provider,
        runMethodOverride?: (contract: Contract, functionName: string, options: RunOptions) => RunFunction,
    );
    static getContractAddress(transaction: { from: string; nonce: BigNumberish }): string;
    static getInterface(contractInterface: ContractInterface): Interface;
    deployed(): Promise<Contract>;
    _deployed(blockTag?: BlockTag): Promise<Contract>;
    fallback(overrides?: TransactionRequest): Promise<TransactionResponse>;
    connect(signerOrProvider: Signer | Provider | string): Contract;
    attach(addressOrName: string): Contract;
    static isIndexed(value: any): value is Indexed;
    private _normalizeRunningEvent;
    private _getRunningEvent;
    _checkRunningEvents(runningEvent: RunningEvent): void;
    private _wrapEvent;
    private _addEventListener;
    queryFilter(
        event: EventFilter,
        fromBlockOrBlockhash?: BlockTag | string,
        toBlock?: BlockTag,
    ): Promise<Array<Event>>;
    on(event: EventFilter | string, listener: Listener): this;
    once(event: EventFilter | string, listener: Listener): this;
    emit(eventName: EventFilter | string, ...args: Array<any>): boolean;
    listenerCount(eventName?: EventFilter | string): number;
    listeners(eventName?: EventFilter | string): Array<Listener>;
    removeAllListeners(eventName?: EventFilter | string): this;
    off(eventName: EventFilter | string, listener: Listener): this;
    removeListener(eventName: EventFilter | string, listener: Listener): this;
}
export {};
