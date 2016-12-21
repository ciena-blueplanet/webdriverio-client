#!/bin/bash


TEST_PORT=`perl -MSocket -le 'socket S, PF_INET, SOCK_STREAM,getprotobyname("tcp"); \$\$port = int(rand(1080))+1080; ++\$\$port until bind S, sockaddr_in(\$\$port,inet_aton("127.1")); print \$\$port'`
HOSTNAME="localhost"
SELENIUM_HOST="localhost"
SELENIUM_PORT=4444
SELENIUM_BROWSER="firefox"
BASEDIR=$(dirname $0)
TEST_RESULT=0

function create_config {
  echo "{" > $TEST_CONFIG
	echo "    \"selenium\": {" >> $TEST_CONFIG
	echo "        \"host\": \"$SELENIUM_HOST\"," >> $TEST_CONFIG
	echo "        \"port\": \"$SELENIUM_PORT\"," >> $TEST_CONFIG
	echo "        \"browser\": \"$SELENIUM_BROWSER\"" >> $TEST_CONFIG
	echo "    }," >> $TEST_CONFIG
	echo "    \"http\": {" >> $TEST_CONFIG
	echo "        \"host\": \"$HOSTNAME\"," >> $TEST_CONFIG
	echo "        \"port\": \"$TEST_PORT\"," >> $TEST_CONFIG
	echo "        \"entryPoint\": \"/\"" >> $TEST_CONFIG
	echo "    }," >> $TEST_CONFIG
	echo "    \"seleniumServer\": \"$SELENIUM_HOST\"," >> $TEST_CONFIG # for backward-compatibility
	echo "    \"url\": \"http://$HOSTNAME:$TEST_PORT/\"" >> $TEST_CONFIG # for backwrd-compatibility
	echo "}" >> $TEST_CONFIG

}


function clean_screenshots {
  echo "Removing everything but *.baseline.png files from $SCREENSHOTS_DIR"
	find $SCREENSHOTS_DIR -type f ! -name *.baseline.png -exec rm -f {} \; || echo "No screenshots present"
}


function cleanup_existing_screenshots {
	echo "Reverting any changes in $SCREENSHOTS_DIR"
	git checkout $SCREENSHOTS_DIR || echo "Not using git"
}


function remote_e2e_test {
  do_remote_e2e_test
  cleanup_existing_screenshots
}


function do_remote_e2e_test {
  clean_screenshots
  create_config
  echo "webdriver server : $WEBDRIVERIO_SERVER"
  ./node_modules/webdriverio-client/scripts/webdriverioTester.js --server $WEBDRIVERIO_SERVER $WEBDRIVERIO_SERVER_EXTRAS || TEST_RESULT=1
}


function update_screenshots {
  for i in `find $E2E_TESTS_DIR/screenshots -name '*.regression.png'`
  do
    echo "mv $i ${i/regression/baseline}"
    mv $i ${i/regression/baseline}
  done
}

if [ "$1" = "update_screenshots" ]; then
  E2E_TESTS_DIR=$2
  SCREENSHOTS_DIR="$E2E_TESTS_DIR/screenshots"
  update_screenshots
fi

if [ "$1" = "remote_e2e_test" ]; then
  WEBDRIVERIO_SERVER=$2
  BUILD_OUTPUT_DIR=$3
  E2E_TESTS_DIR=$4

  SCREENSHOTS_DIR="$E2E_TESTS_DIR/screenshots"
  TEST_CONFIG="$E2E_TESTS_DIR/test-config.json"

  export WEBDRIVERIO_SERVER
  export BUILD_OUTPUT_DIR
  export E2E_TESTS_DIR

  remote_e2e_test
  exit $TEST_RESULT
fi

if [ "$1" = "local_e2e_test" ]; then
  DOCKER_CONTAINER=$(docker ps -ql)
  DOCKER_PORT=$(echo $(docker inspect --format='{{(index (index .NetworkSettings.Ports "3001/tcp") 0).HostPort}}' $DOCKER_CONTAINER))
  if [ -z "$DOCKER_PORT" ]; then
    echo "Cannot find port on Docker system. Is container running with -P flag?"
    exit 1
  fi

  WEBDRIVERIO_SERVER=localhost:$DOCKER_PORT
  echo "DOCKER_CONTAINER: $DOCKER_CONTAINER"
  echo "DOCKER_PORT: $DOCKER_PORT"

  BUILD_OUTPUT_DIR=$2
  E2E_TESTS_DIR=$3

  SCREENSHOTS_DIR="$E2E_TESTS_DIR/screenshots"
  TEST_CONFIG="$E2E_TESTS_DIR/test-config.json"

  export WEBDRIVERIO_SERVER
  export BUILD_OUTPUT_DIR
  export E2E_TESTS_DIR

  remote_e2e_test
  exit $TEST_RESULT
fi
