/* global Auth0Lock */
(function() {
  function appendScript(src, callback) {
    var new_script = document.createElement('script');
    new_script.setAttribute('src', src);
    new_script.onload = callback;
    document.head.appendChild(new_script);
  }

  var script_url = '//cdn.auth0.com/js/lock/11.1.1/lock.min.js';

  var Auth0Options;
  var lock;

  appendScript(script_url, function() {
    var checkInterval = setInterval(function() {
      if (!Discourse.SiteSettings) {
        return;
      }
      Auth0Options = {
        auth: {
          redirect: true,
          redirectUrl: Discourse.SiteSettings.auth0_callback_url,
          responseType: 'code'
        },
        theme: {
          logo:
            'https://storage.googleapis.com/angels-prod/public/platform/logo-social-small.jpg',
          primaryColor: '#0e77ca'
        }
      };

      clearInterval(checkInterval);

      if (!Discourse.SiteSettings.auth0_client_id) {
        return;
      }
    }, 300);
  });

  var LoginController = require('discourse/controllers/login').default;
  LoginController.reopen({
    authenticationComplete: function() {
      if (lock) {
        lock.hide();
      }
      return this._super.apply(this, arguments);
    }
  });

  var ApplicationRoute = require('discourse/routes/application').default;
  ApplicationRoute.reopen({
    actions: {
      showLogin: function() {
        if (
          !Discourse.SiteSettings.auth0_client_id ||
          Discourse.SiteSettings.auth0_connection !== ''
        ) {
          return this._super();
        }

        Auth0Options.initialScreen = 'login';
        lock = new Auth0Lock(
          Discourse.SiteSettings.auth0_client_id,
          Discourse.SiteSettings.auth0_domain,
          Auth0Options
        );

        lock.show();

        this.controllerFor('login').resetForm();
      },
      showCreateAccount: function() {
        if (
          !Discourse.SiteSettings.auth0_client_id ||
          Discourse.SiteSettings.auth0_connection !== ''
        ) {
          return this._super();
        }

        var createAccountController = Discourse.__container__.lookup(
          'controller:createAccount'
        );

        if (createAccountController && createAccountController.accountEmail) {
          if (lock) {
            lock.hide();
            Discourse.Route.showModal(this, 'createAccount');
          } else {
            this._super();
          }
        } else {
          Auth0Options.initialScreen = 'signUp';
          lock = new Auth0Lock(
            Discourse.SiteSettings.auth0_client_id,
            Discourse.SiteSettings.auth0_domain,
            Auth0Options
          );

          lock.show();
        }
      }
    }
  });
})();
