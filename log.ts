  parseLog(log: { topics: Array<string>; data: string }): _LogDescription {
    for (const name in this.events) {
      if (name.indexOf('(') === -1) {
        continue;
      }
      const event = this.events[name];
      if (event.anonymous) {
        continue;
      }
      if (event.topic !== log.topics[0]) {
        continue;
      }

      // @TODO: If anonymous, and the only method, and the input count matches, should we parse and return it?

      return new _LogDescription({
        decode: event.decode,
        name: event.name,
        signature: event.signature,
        topic: event.topic,
        values: event.decode(log.data, log.topics),
      });
    }

    return null;
  }
