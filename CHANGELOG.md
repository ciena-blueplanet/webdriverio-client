# 3.0.0
- Pulled out all token-based functionality, reverting to original use-case
- Rebased to original source
- Updated for Docker use-case and cleaned up `README.md`

# 2.0.1
* Fixed headers for localhost testing

# 2.0.0
* Added support for backtracking usernames from commit id's
* Added support for Travis commits with the new webdriverio-server

# 1.1.0
* Required users to include a config.json file in their tests/e2e directory with a valid GitHub username and a token generated from the webdriverio server. This username and token are send as headers and are used to authenticate a user on before they can run their e2e tests.

