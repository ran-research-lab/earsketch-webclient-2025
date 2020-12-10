app.service('timesync', ['esconsole', 'websocket', 'audioContext', 'userProject', function (esconsole, websocket, context, userProject) {
    var self = this;

    this.available = false;
    this.enabled = false;
    this.ready = false;
    var syncRequestResolver = null;
    var requestAllowed = true;

    this.serverOffset = 0;
    this.useWebaudioClock = false;

    var tc0; // timestamp at client request
    var tc1; // timestamp at client reception
    var ts; // timestamp at server reception / response

    var uzi = 33;
    var rounds = uzi;
    var pool = [];

    this.now = function () {
        if (self.useWebaudioClock) {
            return context.currentTime;
        } else {
            return Date.now() / 1000;
        }
    };

    function syncRequest() {
        esconsole('querying server time offset', ['timesync', 'debug']);
        tc0 = self.now();

        // TODO: websocket.isOpen field not working???
        if (userProject.isLogged()) {
            websocket.send({
                notification_type: 'syncRequest'
            });
        } else {
            esconsole('no websocket connection', ['timesync']);
            self.enabled = false;
            self.ready = false;
        }
    }

    websocket.subscribe(function (event, data) {
        if (data.notification_type === 'syncResponse') {
            ts = parseInt(data.date) / 1000;
            tc1 = self.now();

            // NTP equation
            var offset = ((ts-tc0) + (ts-tc1)) / 2;
            pool.push(offset);

            if (rounds > 0) {
                esconsole('received server time offset: ' + offset, ['timesync', 'debug']);

                rounds--;
                syncRequest();
            } else {
                pool.sort(function (a, b) {
                    return a - b;
                });
                esconsole('time sync pool: ' + pool.toString(), ['timesync', 'debug']);
                self.serverOffset = pool[Math.ceil(uzi/2)]; // median
                esconsole('median server offset: ' + self.serverOffset, ['timesync']);
                self.ready = true;
                self.enabled = true;
                pool = [];
                rounds = uzi;

                if (syncRequestResolver) {
                    syncRequestResolver(true);
                }
            }
        }
    });

    this.enable = function () {
        esconsole('trying to enable time sync', ['timesync', 'debug']);

        // prevent sync-request spamming
        if (requestAllowed) {
            syncRequest();

            requestAllowed = false;
            setTimeout(function () {
                requestAllowed = true;
            }, 30 * 1000); // max 1 request per 30 seconds

            return new Promise(function (resolve) {
                syncRequestResolver = resolve;
            });
        } else {
            esconsole('requests too frequent; using old data', ['timesync', 'debug']);
            this.enabled = this.ready;
            return Promise.resolve(this.ready);
        }
    };

    this.disable = function () {
        esconsole('disabling time sync', ['timesync', 'debug']);
        this.enabled = false;

        return this.enabled;
    };

    this.getSyncOffset = function (bpm, playheadOffset) {
        var barInterval = 60 / bpm * 4;
        var serverTime = this.now() + this.serverOffset;

        // var batchTime = context.baseLatency || (128 / context.sampleRate);
        return barInterval - ((serverTime - playheadOffset) % barInterval);
    };
}]);