'use strict';
var __extends =
    (this && this.__extends) ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype = b === null ? Object.create(b) : ((__.prototype = b.prototype), new __());
        };
    })();
Object.defineProperty(exports, '__esModule', { value: true });
var abi_1 = require('@ethersproject/abi');
var abstract_provider_1 = require('@ethersproject/abstract-provider');
var abstract_signer_1 = require('@ethersproject/abstract-signer');
var address_1 = require('@ethersproject/address');
var bignumber_1 = require('@ethersproject/bignumber');
var bytes_1 = require('@ethersproject/bytes');
var constants_1 = require('@ethersproject/constants');
var properties_1 = require('@ethersproject/properties');
var logger_1 = require('@ethersproject/logger');
var _version_1 = require('./_version');
var logger = new logger_1.Logger(_version_1.version);
///////////////////////////////
var allowedTransactionKeys = {
    chainId: true,
    data: true,
    from: true,
    gasLimit: true,
    gasPrice: true,
    nonce: true,
    to: true,
    value: true,
};
// Recursively replaces ENS names with promises to resolve the name and resolves all properties
function resolveAddresses(signerOrProvider, value, paramType) {
    if (Array.isArray(paramType)) {
        return Promise.all(
            paramType.map(function (paramType, index) {
                return resolveAddresses(
                    signerOrProvider,
                    Array.isArray(value) ? value[index] : value[paramType.name],
                    paramType,
                );
            }),
        );
    }
    if (paramType.type === 'address') {
        return signerOrProvider.resolveName(value);
    }
    if (paramType.type === 'tuple') {
        return resolveAddresses(signerOrProvider, value, paramType.components);
    }
    if (paramType.baseType === 'array') {
        if (!Array.isArray(value)) {
            throw new Error('invalid value for array');
        }
        return Promise.all(
            value.map(function (v) {
                return resolveAddresses(signerOrProvider, v, paramType.arrayChildren);
            }),
        );
    }
    return Promise.resolve(value);
}
function runMethod(contract, functionName, options) {
    var method = contract.interface.functions[functionName];
    return function () {
        var _this = this;
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        var tx = {};
        var blockTag = null;
        // If 1 extra parameter was passed in, it contains overrides
        if (params.length === method.inputs.length + 1 && typeof params[params.length - 1] === 'object') {
            tx = properties_1.shallowCopy(params.pop());
            if (tx.blockTag != null) {
                blockTag = tx.blockTag;
            }
            delete tx.blockTag;
            // Check for unexpected keys (e.g. using "gas" instead of "gasLimit")
            for (var key in tx) {
                if (!allowedTransactionKeys[key]) {
                    logger.throwError('unknown transaction override - ' + key, 'overrides', tx);
                }
            }
        }
        logger.checkArgumentCount(params.length, method.inputs.length, 'passed to contract');
        // Check overrides make sense
        ['data', 'to'].forEach(function (key) {
            if (tx[key] != null) {
                logger.throwError('cannot override ' + key, logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                    operation: key,
                });
            }
        });
        // If the contract was just deployed, wait until it is minded
        if (contract.deployTransaction != null) {
            tx.to = contract._deployed(blockTag).then(function () {
                return contract.addressPromise;
            });
        } else {
            tx.to = contract.addressPromise;
        }
        return resolveAddresses(contract.signer || contract.provider, params, method.inputs).then(function (params) {
            tx.data = contract.interface.encodeFunctionData(method, params);
            if (method.constant || options.callStatic) {
                // Call (constant functions) always cost 0 ether
                if (options.estimate) {
                    return Promise.resolve(constants_1.Zero);
                }
                if (!contract.provider && !contract.signer) {
                    logger.throwError(
                        'call (constant functions) require a provider or signer',
                        logger_1.Logger.errors.UNSUPPORTED_OPERATION,
                        { operation: 'call' },
                    );
                }
                // Check overrides make sense
                ['gasLimit', 'gasPrice', 'value'].forEach(function (key) {
                    if (tx[key] != null) {
                        throw new Error('call cannot override ' + key);
                    }
                });
                if (options.transaction) {
                    return properties_1.resolveProperties(tx);
                }
                return (contract.signer || contract.provider).call(tx, blockTag).then(function (value) {
                    try {
                        var result = contract.interface.decodeFunctionResult(method, value);
                        if (method.outputs.length === 1) {
                            result = result[0];
                        }
                        return result;
                    } catch (error) {
                        if (error.code === logger_1.Logger.errors.CALL_EXCEPTION) {
                            error.address = contract.address;
                            error.args = params;
                            error.transaction = tx;
                        }
                        throw error;
                    }
                });
            }
            // Only computing the transaction estimate
            if (options.estimate) {
                if (!contract.provider && !contract.signer) {
                    logger.throwError(
                        'estimate require a provider or signer',
                        logger_1.Logger.errors.UNSUPPORTED_OPERATION,
                        { operation: 'estimateGas' },
                    );
                }
                return (contract.signer || contract.provider).estimateGas(tx);
            }
            if (tx.gasLimit == null && method.gas != null) {
                tx.gasLimit = bignumber_1.BigNumber.from(method.gas).add(21000);
            }
            if (tx.value != null && !method.payable) {
                logger.throwError('contract method is not payable', logger_1.Logger.errors.INVALID_ARGUMENT, {
                    argument: 'sendTransaction',
                    value: tx,
                    method: method.format(),
                });
            }
            if (options.transaction) {
                return properties_1.resolveProperties(tx);
            }
            if (!contract.signer) {
                logger.throwError(
                    'sending a transaction require a signer',
                    logger_1.Logger.errors.UNSUPPORTED_OPERATION,
                    { operation: 'sendTransaction' },
                );
            }
            return contract.signer.sendTransaction(tx).then(function (tx) {
                var wait = tx.wait.bind(tx);
                tx.wait = function (confirmations) {
                    return wait(confirmations).then(function (receipt) {
                        receipt.events = receipt.logs.map(function (log) {
                            var event = properties_1.deepCopy(log);
                            var parsed = contract.interface.parseLog(log);
                            if (parsed) {
                                event.values = parsed.values;
                                event.decode = function (data, topics) {
                                    return _this.interface.decodeEventLog(parsed.eventFragment, data, topics);
                                };
                                event.event = parsed.name;
                                event.eventSignature = parsed.signature;
                            }
                            event.removeListener = function () {
                                return contract.provider;
                            };
                            event.getBlock = function () {
                                return contract.provider.getBlock(receipt.blockHash);
                            };
                            event.getTransaction = function () {
                                return contract.provider.getTransaction(receipt.transactionHash);
                            };
                            event.getTransactionReceipt = function () {
                                return Promise.resolve(receipt);
                            };
                            return event;
                        });
                        return receipt;
                    });
                };
                return tx;
            });
        });
    };
}
function getEventTag(filter) {
    if (filter.address && (filter.topics == null || filter.topics.length === 0)) {
        return '*';
    }
    return (filter.address || '*') + '@' + (filter.topics ? filter.topics.join(':') : '');
}
var RunningEvent = /** @class */ (function () {
    function RunningEvent(tag, filter) {
        properties_1.defineReadOnly(this, 'tag', tag);
        properties_1.defineReadOnly(this, 'filter', filter);
        this._listeners = [];
    }
    RunningEvent.prototype.addListener = function (listener, once) {
        this._listeners.push({ listener: listener, once: once });
    };
    RunningEvent.prototype.removeListener = function (listener) {
        var done = false;
        this._listeners = this._listeners.filter(function (item) {
            if (done || item.listener !== listener) {
                return true;
            }
            done = true;
            return false;
        });
    };
    RunningEvent.prototype.removeAllListeners = function () {
        this._listeners = [];
    };
    RunningEvent.prototype.listeners = function () {
        return this._listeners.map(function (i) {
            return i.listener;
        });
    };
    RunningEvent.prototype.listenerCount = function () {
        return this._listeners.length;
    };
    RunningEvent.prototype.run = function (args) {
        var _this = this;
        var listenerCount = this.listenerCount();
        this._listeners = this._listeners.filter(function (item) {
            var argsCopy = args.slice();
            // Call the callback in the next event loop
            setTimeout(function () {
                item.listener.apply(_this, argsCopy);
            }, 0);
            // Reschedule it if it not "once"
            return !item.once;
        });
        return listenerCount;
    };
    RunningEvent.prototype.prepareEvent = function (event) {};
    return RunningEvent;
})();
var ErrorRunningEvent = /** @class */ (function (_super) {
    __extends(ErrorRunningEvent, _super);
    function ErrorRunningEvent() {
        return _super.call(this, 'error', null) || this;
    }
    return ErrorRunningEvent;
})(RunningEvent);
var FragmentRunningEvent = /** @class */ (function (_super) {
    __extends(FragmentRunningEvent, _super);
    function FragmentRunningEvent(address, contractInterface, fragment, topics) {
        var _this = this;
        var filter = {
            address: address,
        };
        var topic = contractInterface.getEventTopic(fragment);
        if (topics) {
            if (topic !== topics[0]) {
                logger.throwArgumentError('topic mismatch', 'topics', topics);
            }
            filter.topics = topics.slice();
        } else {
            filter.topics = [topic];
        }
        _this = _super.call(this, getEventTag(filter), filter) || this;
        properties_1.defineReadOnly(_this, 'address', address);
        properties_1.defineReadOnly(_this, 'interface', contractInterface);
        properties_1.defineReadOnly(_this, 'fragment', fragment);
        return _this;
    }
    FragmentRunningEvent.prototype.prepareEvent = function (event) {
        var _this = this;
        _super.prototype.prepareEvent.call(this, event);
        event.event = this.fragment.name;
        event.eventSignature = this.fragment.format();
        event.decode = function (data, topics) {
            return _this.interface.decodeEventLog(_this.fragment, data, topics);
        };
        event.values = this.interface.decodeEventLog(this.fragment, event.data, event.topics);
    };
    return FragmentRunningEvent;
})(RunningEvent);
var WildcardRunningEvent = /** @class */ (function (_super) {
    __extends(WildcardRunningEvent, _super);
    function WildcardRunningEvent(address, contractInterface) {
        var _this = _super.call(this, '*', { address: address }) || this;
        properties_1.defineReadOnly(_this, 'address', address);
        properties_1.defineReadOnly(_this, 'interface', contractInterface);
        return _this;
    }
    WildcardRunningEvent.prototype.prepareEvent = function (event) {
        var _this = this;
        _super.prototype.prepareEvent.call(this, event);
        var parsed = this.interface.parseLog(event);
        if (parsed) {
            event.event = parsed.name;
            event.eventSignature = parsed.signature;
            event.decode = function (data, topics) {
                return _this.interface.decodeEventLog(parsed.eventFragment, data, topics);
            };
            event.values = parsed.values;
        }
    };
    return WildcardRunningEvent;
})(RunningEvent);
// Is exactly the same as Ethers v5 Contract class
// except it has an optional runMethodOverride function in the constructor
var Contract = /** @class */ (function () {
    function Contract(
        addressOrName,
        contractInterface,
        signerOrProvider,
        // Added optional runMethodOverride function that defaults to the original runMethod function
        runMethodOverride,
    ) {
        var _newTarget = this.constructor;
        var _this = this;
        if (runMethodOverride === void 0) {
            runMethodOverride = runMethod;
        }
        logger.checkNew(_newTarget, Contract);
        // @TODO: Maybe still check the addressOrName looks like a valid address or name?
        //address = getAddress(address);
        properties_1.defineReadOnly(
            this,
            'interface',
            properties_1.getStatic(_newTarget, 'getInterface')(contractInterface),
        );
        if (abstract_signer_1.Signer.isSigner(signerOrProvider)) {
            properties_1.defineReadOnly(this, 'provider', signerOrProvider.provider || null);
            properties_1.defineReadOnly(this, 'signer', signerOrProvider);
        } else if (abstract_provider_1.Provider.isProvider(signerOrProvider)) {
            properties_1.defineReadOnly(this, 'provider', signerOrProvider);
            properties_1.defineReadOnly(this, 'signer', null);
        } else {
            logger.throwError('invalid signer or provider', logger_1.Logger.errors.INVALID_ARGUMENT, {
                arg: 'signerOrProvider',
                value: signerOrProvider,
            });
        }
        properties_1.defineReadOnly(this, 'callStatic', {});
        properties_1.defineReadOnly(this, 'estimate', {});
        properties_1.defineReadOnly(this, 'functions', {});
        properties_1.defineReadOnly(this, 'populateTransaction', {});
        properties_1.defineReadOnly(this, 'filters', {});
        Object.keys(this.interface.events).forEach(function (eventName) {
            var event = _this.interface.events[eventName];
            properties_1.defineReadOnly(_this.filters, eventName, function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return {
                    address: _this.address,
                    topics: _this.interface.encodeFilterTopics(event, args),
                };
            });
        });
        properties_1.defineReadOnly(this, '_runningEvents', {});
        properties_1.defineReadOnly(this, '_wrappedEmits', {});
        properties_1.defineReadOnly(this, 'address', addressOrName);
        if (this.provider) {
            properties_1.defineReadOnly(
                this,
                'addressPromise',
                this.provider
                    .resolveName(addressOrName)
                    .then(function (address) {
                        if (address == null) {
                            throw new Error('name not found');
                        }
                        return address;
                    })
                    .catch(function (error) {
                        console.log('ERROR: Cannot find Contract - ' + addressOrName);
                        throw error;
                    }),
            );
        } else {
            try {
                properties_1.defineReadOnly(
                    this,
                    'addressPromise',
                    Promise.resolve(this.interface.constructor.getAddress(addressOrName)),
                );
            } catch (error) {
                // Without a provider, we cannot use ENS names
                logger.throwError(
                    'provider is required to use non-address contract address',
                    logger_1.Logger.errors.INVALID_ARGUMENT,
                    { argument: 'addressOrName', value: addressOrName },
                );
            }
        }
        Object.keys(this.interface.functions).forEach(function (name) {
            var run = runMethodOverride(_this, name, {});
            if (_this[name] == null) {
                properties_1.defineReadOnly(_this, name, run);
            }
            if (_this.functions[name] == null) {
                properties_1.defineReadOnly(_this.functions, name, run);
            }
            if (_this.callStatic[name] == null) {
                properties_1.defineReadOnly(_this.callStatic, name, runMethod(_this, name, { callStatic: true }));
            }
            if (_this.populateTransaction[name] == null) {
                properties_1.defineReadOnly(
                    _this.populateTransaction,
                    name,
                    runMethod(_this, name, { transaction: true }),
                );
            }
            if (_this.estimate[name] == null) {
                properties_1.defineReadOnly(_this.estimate, name, runMethod(_this, name, { estimate: true }));
            }
        });
    }
    Contract.getContractAddress = function (transaction) {
        return address_1.getContractAddress(transaction);
    };
    Contract.getInterface = function (contractInterface) {
        if (abi_1.Interface.isInterface(contractInterface)) {
            return contractInterface;
        }
        return new abi_1.Interface(contractInterface);
    };
    // @TODO: Allow timeout?
    Contract.prototype.deployed = function () {
        return this._deployed();
    };
    Contract.prototype._deployed = function (blockTag) {
        var _this = this;
        if (!this._deployedPromise) {
            // If we were just deployed, we know the transaction we should occur in
            if (this.deployTransaction) {
                this._deployedPromise = this.deployTransaction.wait().then(function () {
                    return _this;
                });
            } else {
                // @TODO: Once we allow a timeout to be passed in, we will wait
                // up to that many blocks for getCode
                // Otherwise, poll for our code to be deployed
                this._deployedPromise = this.provider.getCode(this.address, blockTag).then(function (code) {
                    if (code === '0x') {
                        logger.throwError('contract not deployed', logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                            contractAddress: _this.address,
                            operation: 'getDeployed',
                        });
                    }
                    return _this;
                });
            }
        }
        return this._deployedPromise;
    };
    // @TODO:
    // estimateFallback(overrides?: TransactionRequest): Promise<BigNumber>
    // @TODO:
    // estimateDeploy(bytecode: string, ...args): Promise<BigNumber>
    Contract.prototype.fallback = function (overrides) {
        var _this = this;
        if (!this.signer) {
            logger.throwError('sending a transaction require a signer', logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: 'sendTransaction(fallback)',
            });
        }
        var tx = properties_1.shallowCopy(overrides || {});
        ['from', 'to'].forEach(function (key) {
            if (tx[key] == null) {
                return;
            }
            logger.throwError('cannot override ' + key, logger_1.Logger.errors.UNSUPPORTED_OPERATION, {
                operation: key,
            });
        });
        tx.to = this.addressPromise;
        return this.deployed().then(function () {
            return _this.signer.sendTransaction(tx);
        });
    };
    // Reconnect to a different signer or provider
    Contract.prototype.connect = function (signerOrProvider) {
        if (typeof signerOrProvider === 'string') {
            signerOrProvider = new abstract_signer_1.VoidSigner(signerOrProvider, this.provider);
        }
        var contract = new this.constructor(this.address, this.interface, signerOrProvider);
        if (this.deployTransaction) {
            properties_1.defineReadOnly(contract, 'deployTransaction', this.deployTransaction);
        }
        return contract;
    };
    // Re-attach to a different on-chain instance of this contract
    Contract.prototype.attach = function (addressOrName) {
        return new this.constructor(addressOrName, this.interface, this.signer || this.provider);
    };
    Contract.isIndexed = function (value) {
        return abi_1.Indexed.isIndexed(value);
    };
    Contract.prototype._normalizeRunningEvent = function (runningEvent) {
        // Already have an instance of this event running; we can re-use it
        if (this._runningEvents[runningEvent.tag]) {
            return this._runningEvents[runningEvent.tag];
        }
        return runningEvent;
    };
    Contract.prototype._getRunningEvent = function (eventName) {
        if (typeof eventName === 'string') {
            // Listen for "error" events (if your contract has an error event, include
            // the full signature to bypass this special event keyword)
            if (eventName === 'error') {
                return this._normalizeRunningEvent(new ErrorRunningEvent());
            }
            // Listen for any event
            if (eventName === '*') {
                return this._normalizeRunningEvent(new WildcardRunningEvent(this.address, this.interface));
            }
            var fragment = this.interface.getEvent(eventName);
            if (!fragment) {
                logger.throwError('unknown event - ' + eventName, logger_1.Logger.errors.INVALID_ARGUMENT, {
                    argumnet: 'eventName',
                    value: eventName,
                });
            }
            return this._normalizeRunningEvent(new FragmentRunningEvent(this.address, this.interface, fragment));
        }
        var filter = {
            address: this.address,
        };
        // Find the matching event in the ABI; if none, we still allow filtering
        // since it may be a filter for an otherwise unknown event
        if (eventName.topics) {
            if (eventName.topics[0]) {
                var fragment = this.interface.getEvent(eventName.topics[0]);
                if (fragment) {
                    return this._normalizeRunningEvent(
                        new FragmentRunningEvent(this.address, this.interface, fragment, eventName.topics),
                    );
                }
            }
            filter.topics = eventName.topics;
        }
        return this._normalizeRunningEvent(new RunningEvent(getEventTag(filter), filter));
    };
    Contract.prototype._checkRunningEvents = function (runningEvent) {
        if (runningEvent.listenerCount() === 0) {
            delete this._runningEvents[runningEvent.tag];
        }
        // If we have a poller for this, remove it
        var emit = this._wrappedEmits[runningEvent.tag];
        if (emit) {
            this.provider.off(runningEvent.filter, emit);
            delete this._wrappedEmits[runningEvent.tag];
        }
    };
    Contract.prototype._wrapEvent = function (runningEvent, log, listener) {
        var _this = this;
        var event = properties_1.deepCopy(log);
        try {
            runningEvent.prepareEvent(event);
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
        event.removeListener = function () {
            if (!listener) {
                return;
            }
            runningEvent.removeListener(listener);
            _this._checkRunningEvents(runningEvent);
        };
        event.getBlock = function () {
            return _this.provider.getBlock(log.blockHash);
        };
        event.getTransaction = function () {
            return _this.provider.getTransaction(log.transactionHash);
        };
        event.getTransactionReceipt = function () {
            return _this.provider.getTransactionReceipt(log.transactionHash);
        };
        return event;
    };
    Contract.prototype._addEventListener = function (runningEvent, listener, once) {
        var _this = this;
        if (!this.provider) {
            logger.throwError(
                'events require a provider or a signer with a provider',
                logger_1.Logger.errors.UNSUPPORTED_OPERATION,
                { operation: 'once' },
            );
        }
        runningEvent.addListener(listener, once);
        // Track this running event and its listeners (may already be there; but no hard in updating)
        this._runningEvents[runningEvent.tag] = runningEvent;
        // If we are not polling the provider, start
        if (!this._wrappedEmits[runningEvent.tag]) {
            var wrappedEmit = function (log) {
                var event = _this._wrapEvent(runningEvent, log, listener);
                var values = event.values || [];
                values.push(event);
                _this.emit.apply(_this, [runningEvent.filter].concat(values));
            };
            this._wrappedEmits[runningEvent.tag] = wrappedEmit;
            // Special events, like "error" do not have a filter
            if (runningEvent.filter != null) {
                this.provider.on(runningEvent.filter, wrappedEmit);
            }
        }
    };
    Contract.prototype.queryFilter = function (event, fromBlockOrBlockhash, toBlock) {
        var _this = this;
        var runningEvent = this._getRunningEvent(event);
        var filter = properties_1.shallowCopy(runningEvent.filter);
        if (typeof fromBlockOrBlockhash === 'string' && bytes_1.isHexString(fromBlockOrBlockhash, 32)) {
            if (toBlock != null) {
                logger.throwArgumentError('cannot specify toBlock with blockhash', 'toBlock', toBlock);
            }
            filter.blockhash = fromBlockOrBlockhash;
        } else {
            filter.fromBlock = fromBlockOrBlockhash != null ? fromBlockOrBlockhash : 0;
            filter.toBlock = toBlock != null ? toBlock : 'latest';
        }
        return this.provider.getLogs(filter).then(function (logs) {
            return logs.map(function (log) {
                return _this._wrapEvent(runningEvent, log, null);
            });
        });
    };
    Contract.prototype.on = function (event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, false);
        return this;
    };
    Contract.prototype.once = function (event, listener) {
        this._addEventListener(this._getRunningEvent(event), listener, true);
        return this;
    };
    Contract.prototype.emit = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.provider) {
            return false;
        }
        var runningEvent = this._getRunningEvent(eventName);
        var result = runningEvent.run(args) > 0;
        // May have drained all the "once" events; check for living events
        this._checkRunningEvents(runningEvent);
        return result;
    };
    Contract.prototype.listenerCount = function (eventName) {
        if (!this.provider) {
            return 0;
        }
        return this._getRunningEvent(eventName).listenerCount();
    };
    Contract.prototype.listeners = function (eventName) {
        if (!this.provider) {
            return [];
        }
        if (eventName == null) {
            var result_1 = [];
            for (var tag in this._runningEvents) {
                this._runningEvents[tag].listeners().forEach(function (listener) {
                    result_1.push(listener);
                });
            }
            return result_1;
        }
        return this._getRunningEvent(eventName).listeners();
    };
    Contract.prototype.removeAllListeners = function (eventName) {
        if (!this.provider) {
            return this;
        }
        if (eventName == null) {
            for (var tag in this._runningEvents) {
                var runningEvent_1 = this._runningEvents[tag];
                runningEvent_1.removeAllListeners();
                this._checkRunningEvents(runningEvent_1);
            }
            return this;
        }
        // Delete any listeners
        var runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeAllListeners();
        this._checkRunningEvents(runningEvent);
        return this;
    };
    Contract.prototype.off = function (eventName, listener) {
        if (!this.provider) {
            return this;
        }
        var runningEvent = this._getRunningEvent(eventName);
        runningEvent.removeListener(listener);
        this._checkRunningEvents(runningEvent);
        return this;
    };
    Contract.prototype.removeListener = function (eventName, listener) {
        return this.off(eventName, listener);
    };
    return Contract;
})();
exports.Contract = Contract;
