// Generated by CoffeeScript 1.3.3
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __slice = [].slice;

Hoodie.RemoteStore = (function(_super) {

  __extends(RemoteStore, _super);

  RemoteStore.prototype._sync = false;

  function RemoteStore(hoodie, options) {
    this.hoodie = hoodie;
    if (options == null) {
      options = {};
    }
    this._handlePushSuccess = __bind(this._handlePushSuccess, this);

    this._handlePullResults = __bind(this._handlePullResults, this);

    this._handlePullError = __bind(this._handlePullError, this);

    this._handlePullSuccess = __bind(this._handlePullSuccess, this);

    this._restartPullRequest = __bind(this._restartPullRequest, this);

    this.sync = __bind(this.sync, this);

    this.push = __bind(this.push, this);

    this.pull = __bind(this.pull, this);

    this.disconnect = __bind(this.disconnect, this);

    this.connect = __bind(this.connect, this);

    this.basePath = options.basePath || '';
    if (options.sync) {
      this._sync = options.sync;
    }
  }

  RemoteStore.prototype.load = function(type, id) {
    var defer, path;
    defer = RemoteStore.__super__.load.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    path = "/" + encodeURIComponent("" + type + "/" + id);
    return this.request("GET", path);
  };

  RemoteStore.prototype.loadAll = function(type) {
    var defer, path, promise;
    defer = RemoteStore.__super__.loadAll.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    path = "/_all_docs";
    if (type) {
      path = "" + path + "?startkey=\"" + type + "\"&endkey=\"" + type + "0\"";
    }
    promise = this.request("GET", path);
    promise.fail(defer.reject);
    promise.done(function(response) {
      return defer.resolve(response.rows);
    });
    return defer.promise();
  };

  RemoteStore.prototype.save = function(type, id, object) {
    var defer, doc, path;
    defer = RemoteStore.__super__.save.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    if (!id) {
      id = this.uuid();
    }
    object = $.extend({}, object);
    object.type = type;
    object.id = id;
    if (false) {
      this.push([object]);
    }
    doc = this._parseForRemote(object);
    path = "/" + encodeURIComponent(doc._id);
    return this.request("PUT", path, {
      data: doc
    });
  };

  RemoteStore.prototype["delete"] = function(type, id) {
    var defer;
    defer = RemoteStore.__super__["delete"].apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    return console.log.apply(console, [".delete() not yet implemented"].concat(__slice.call(arguments)));
  };

  RemoteStore.prototype.deleteAll = function(type) {
    var defer;
    defer = RemoteStore.__super__.deleteAll.apply(this, arguments);
    if (this.hoodie.isPromise(defer)) {
      return defer;
    }
    return console.log.apply(console, [".deleteAll() not yet implemented"].concat(__slice.call(arguments)));
  };

  RemoteStore.prototype.request = function(type, path, options) {
    if (options == null) {
      options = {};
    }
    path = this.basePath + path;
    options.contentType || (options.contentType = 'application/json');
    if (type === 'POST' || type === 'PUT') {
      options.dataType || (options.dataType = 'json');
      options.processData || (options.processData = false);
      options.data = JSON.stringify(options.data);
    }
    return this.hoodie.request(type, path, options);
  };

  RemoteStore.prototype.get = function(view_name, params) {
    return console.log.apply(console, [".get() not yet implemented"].concat(__slice.call(arguments)));
  };

  RemoteStore.prototype.post = function(update_function_name, params) {
    return console.log.apply(console, [".post() not yet implemented"].concat(__slice.call(arguments)));
  };

  RemoteStore.prototype.connect = function() {
    this.connected = true;
    return this.sync();
  };

  RemoteStore.prototype.disconnect = function() {
    var _ref, _ref1;
    this.connected = false;
    this.hoodie.unbind('store:dirty:idle', this.push);
    if ((_ref = this._pullRequest) != null) {
      _ref.abort();
    }
    return (_ref1 = this._pushRequest) != null ? _ref1.abort() : void 0;
  };

  RemoteStore.prototype.isContinuouslyPulling = function() {
    var _ref;
    return this._sync === true || ((_ref = this._sync) != null ? _ref.pull : void 0) === true;
  };

  RemoteStore.prototype.isContinuouslyPushing = function() {
    var _ref;
    return this._sync === true || ((_ref = this._sync) != null ? _ref.push : void 0) === true;
  };

  RemoteStore.prototype.isContinuouslySyncing = function() {
    return this._sync === true;
  };

  RemoteStore.prototype.getSinceNr = function() {
    return this._since || 0;
  };

  RemoteStore.prototype.setSinceNr = function(seq) {
    return this._since = seq;
  };

  RemoteStore.prototype.pull = function() {
    this._pullRequest = this.request('GET', this._pullUrl());
    if (this.connected && this.isContinuouslyPulling()) {
      window.clearTimeout(this._pullRequestTimeout);
      this._pullRequestTimeout = window.setTimeout(this._restartPullRequest, 25000);
    }
    return this._pullRequest.then(this._handlePullSuccess, this._handlePullError);
  };

  RemoteStore.prototype.push = function(docs) {
    var doc, docsForRemote;
    if (!(docs != null ? docs.length : void 0)) {
      return this.hoodie.defer().resolve([]).promise();
    }
    docsForRemote = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = docs.length; _i < _len; _i++) {
        doc = docs[_i];
        _results.push(this._parseForRemote(doc));
      }
      return _results;
    }).call(this);
    this._pushRequest = this.request('POST', "/_bulk_docs", {
      data: {
        docs: docsForRemote,
        new_edits: false
      }
    });
    return this._pushRequest.done(this._handlePushSuccess(docs, docsForRemote));
  };

  RemoteStore.prototype.sync = function(docs) {
    if (this.isContinuouslyPushing()) {
      this.hoodie.unbind('store:dirty:idle', this.push);
      this.hoodie.on('store:dirty:idle', this.push);
    }
    return this.push(docs).pipe(this.pull);
  };

  RemoteStore.prototype.on = function(event, cb) {
    return this.hoodie.on("remote:" + event, cb);
  };

  RemoteStore.prototype._pullUrl = function() {
    var since;
    since = this.getSinceNr();
    if (this.isContinuouslyPulling()) {
      return "/_changes?include_docs=true&heartbeat=10000&feed=longpoll&since=" + since;
    } else {
      return "/_changes?include_docs=true&since=" + since;
    }
  };

  RemoteStore.prototype._restartPullRequest = function() {
    var _ref;
    return (_ref = this._pullRequest) != null ? _ref.abort() : void 0;
  };

  RemoteStore.prototype._handlePullSuccess = function(response) {
    this.setSinceNr(response.last_seq);
    this._handlePullResults(response.results);
    if (this.connected && this.isContinuouslyPulling()) {
      return this.pull();
    }
  };

  RemoteStore.prototype._handlePullError = function(xhr, error, resp) {
    if (!this.connected) {
      return;
    }
    switch (xhr.status) {
      case 403:
        this.hoodie.trigger('remote:error:unauthenticated', error);
        return this.disconnect();
      case 404:
        return window.setTimeout(this.pull, 3000);
      case 500:
        this.hoodie.trigger('remote:error:server', error);
        return window.setTimeout(this.pull, 3000);
      default:
        if (!this.isContinuouslyPulling()) {
          return;
        }
        if (xhr.statusText === 'abort') {
          return this.pull();
        } else {
          return window.setTimeout(this.pull, 3000);
        }
    }
  };

  RemoteStore.prototype._validSpecialAttributes = ['_id', '_rev', '_deleted', '_revisions', '_attachments'];

  RemoteStore.prototype._parseForRemote = function(obj) {
    var attr, attributes;
    attributes = $.extend({}, obj);
    for (attr in attributes) {
      if (~this._validSpecialAttributes.indexOf(attr)) {
        continue;
      }
      if (!/^_/.test(attr)) {
        continue;
      }
      delete attributes[attr];
    }
    attributes._id = "" + attributes.type + "/" + attributes.id;
    delete attributes.id;
    this._addRevisionTo(attributes);
    return attributes;
  };

  RemoteStore.prototype._generateNewRevisionId = function() {
    var timestamp, uuid;
    this._timezoneOffset || (this._timezoneOffset = new Date().getTimezoneOffset() * 60);
    timestamp = Date.now() + this._timezoneOffset;
    uuid = this.hoodie.my.store.uuid(5);
    return "" + uuid + "#" + timestamp;
  };

  RemoteStore.prototype._addRevisionTo = function(attributes) {
    var currentRevId, currentRevNr, newRevisionId, _ref;
    try {
      _ref = attributes._rev.split(/-/), currentRevNr = _ref[0], currentRevId = _ref[1];
    } catch (_error) {}
    currentRevNr = parseInt(currentRevNr) || 0;
    newRevisionId = this._generateNewRevisionId();
    attributes._rev = "" + (currentRevNr + 1) + "-" + newRevisionId;
    attributes._revisions = {
      start: 1,
      ids: [newRevisionId]
    };
    if (currentRevId) {
      attributes._revisions.start += currentRevNr;
      return attributes._revisions.ids.push(currentRevId);
    }
  };

  RemoteStore.prototype._parseFromPull = function(obj) {
    var id, _ref;
    id = obj._id || obj.id;
    delete obj._id;
    _ref = id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
    if (obj.createdAt) {
      obj.createdAt = new Date(Date.parse(obj.createdAt));
    }
    if (obj.updatedAt) {
      obj.updatedAt = new Date(Date.parse(obj.updatedAt));
    }
    if (obj.rev) {
      obj._rev = obj.rev;
      delete obj.rev;
    }
    return obj;
  };

  RemoteStore.prototype._parseFromPush = function(obj) {
    var id, _ref;
    id = obj._id || delete obj._id;
    _ref = obj.id.split(/\//), obj.type = _ref[0], obj.id = _ref[1];
    obj._rev = obj.rev;
    delete obj.rev;
    delete obj.ok;
    return obj;
  };

  RemoteStore.prototype._handlePullResults = function(changes) {
    var doc, promise, _changedDocs, _destroyedDocs, _i, _j, _k, _len, _len1, _len2, _ref, _ref1, _results,
      _this = this;
    _destroyedDocs = [];
    _changedDocs = [];
    for (_i = 0, _len = changes.length; _i < _len; _i++) {
      doc = changes[_i].doc;
      doc = this._parseFromPull(doc);
      if (doc._deleted) {
        _destroyedDocs.push([
          doc, this.hoodie.my.store.destroy(doc.type, doc.id, {
            remote: true
          })
        ]);
      } else {
        _changedDocs.push([
          doc, this.hoodie.my.store.update(doc.type, doc.id, doc, {
            remote: true
          })
        ]);
      }
    }
    for (_j = 0, _len1 = _destroyedDocs.length; _j < _len1; _j++) {
      _ref = _destroyedDocs[_j], doc = _ref[0], promise = _ref[1];
      promise.then(function(object) {
        _this.hoodie.trigger('remote:destroy', object);
        _this.hoodie.trigger("remote:destroy:" + doc.type, object);
        _this.hoodie.trigger("remote:destroy:" + doc.type + ":" + doc.id, object);
        _this.hoodie.trigger('remote:change', 'destroy', object);
        _this.hoodie.trigger("remote:change:" + doc.type, 'destroy', object);
        return _this.hoodie.trigger("remote:change:" + doc.type + ":" + doc.id, 'destroy', object);
      });
    }
    _results = [];
    for (_k = 0, _len2 = _changedDocs.length; _k < _len2; _k++) {
      _ref1 = _changedDocs[_k], doc = _ref1[0], promise = _ref1[1];
      _results.push(promise.then(function(object, objectWasCreated) {
        var event;
        event = objectWasCreated ? 'create' : 'update';
        _this.hoodie.trigger("remote:" + event, object);
        _this.hoodie.trigger("remote:" + event + ":" + doc.type, object);
        _this.hoodie.trigger("remote:" + event + ":" + doc.type + ":" + doc.id, object);
        _this.hoodie.trigger("remote:change", event, object);
        _this.hoodie.trigger("remote:change:" + doc.type, event, object);
        return _this.hoodie.trigger("remote:change:" + doc.type + ":" + doc.id, event, object);
      }));
    }
    return _results;
  };

  RemoteStore.prototype._handlePushSuccess = function(docs, pushedDocs) {
    var _this = this;
    return function() {
      var doc, i, options, update, _i, _len, _results;
      _results = [];
      for (i = _i = 0, _len = docs.length; _i < _len; i = ++_i) {
        doc = docs[i];
        update = {
          _rev: pushedDocs[i]._rev
        };
        options = {
          remote: true
        };
        _results.push(_this.hoodie.my.store.update(doc.type, doc.id, update, options));
      }
      return _results;
    };
  };

  return RemoteStore;

})(Hoodie.Store);
