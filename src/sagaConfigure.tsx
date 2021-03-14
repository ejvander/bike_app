let sagaRunner: any;
let runSaga = (rootSaga, sagaMiddleware) => {
  if (__DEV__ && module.hot && sagaRunner) {
    sagaRunner.cancel();
  }

  sagaRunner = sagaMiddleware.run(rootSaga);
};

export default runSaga;
