'use strict';

const path  = require('path'),
  fs        = require('fs'),
  rp = require('request-promise'),
  BbPromise = require('bluebird'); // Serverless uses Bluebird Promises and we recommend you do to because they provide more than your average Promise :)

module.exports = function(S) { // Always pass in the ServerlessPlugin Class

  S.classes.Project.newStaticMethod     = function() { console.log("A new method!"); };
  S.classes.Project.prototype.newMethod = function() { S.classes.Project.newStaticMethod(); };


  class PluginBoilerplate extends S.classes.Plugin {

    constructor() {
      super();
      this.name = 'telegram-bot'; // Define your plugin's name
    }

    registerActions() {

      S.addAction(this.setWebHookCommand.bind(this), {
        handler:       'setWebHookCommand',
        description:   'Register Telegram',
        context:       'telegram',
        contextAction: 'setWebHook'
      });

      return BbPromise.resolve();
    }

    _prompt() {
      let _this = this;

     if (!S.config.interactive || _this.evt.options.all) return BbPromise.resolve();

      return BbPromise.try(function() {
          return _this.cliPromptSelectStage('Select a stage: ', _this.evt.options.stage, false)
                .then(stage => {
                  _this.evt.options.stage = stage;
                });
          })
          .then(function() {
            return _this.cliPromptSelectRegion('Select a region: ', false, true, _this.evt.options.region, _this.evt.options.stage)
                .then(region => {
                  _this.evt.options.region = region;
                });
          });
    }

    setWebHookCommand(evt) {

      let _this = this;

      _this.evt = evt;

      let project = S.getProject();

      return _this._prompt().bind(_this).then(function() {

        let Project = S.getProject();

        let stage = Project.getStage(_this.evt.options.stage);

        let region = stage.getRegion(_this.evt.options.region);

        let variables = region.getVariables().toObject();

        let telegramBotAccessToken = variables["telegramBotAccessToken"];

        let telegramBotWebHookUrl = variables["telegramBotWebHookUrl"];

        if (telegramBotAccessToken === undefined) {
          console.log("telegramBotAccessToken is not defined in variables");
          return BbPromise.resolve();
        }

        if (telegramBotWebHookUrl === undefined) {
          console.log("telegramBotWebHookUrl is not defined in variables");
          return BbPromise.resolve();
        }

        var target = "https://api.telegram.org/bot" + telegramBotAccessToken + "/setWebHook";

        var options = {
          method: "POST",
          uri: target,
          form: {
            url: telegramBotWebHookUrl
          }
        };

        return rp(options).then(function (parsedBody) {
          console.log(parsedBody);
          console.log("Success");
        }, function(err) {
          console.log(err);
          console.log("Fail");
        });

      });
    }
  }

  // Export Plugin Class
  return PluginBoilerplate;
};
