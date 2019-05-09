import * as React from "react";
import * as ReactDOM from "react-dom";

import { Store } from 'redux';

import rootReducer from './reducers/rootReducer';
import App from './components/App';

import "./css/bundle.scss";
import "./core/components/Layouts/Mosaic/MosaicLib/styles/index.less";
import "./core/css/mosaic.less";

import { Provider } from "react-redux";
import { nls } from "./core/components/nls";
import { extendNls } from "./components/nls";

import { configEsriInterceptors, registerEsriTokenInterceptor } from "./core/configEsri";
import { InitConfig } from "./core/appConfig";

let initConfig = new InitConfig(registerEsriTokenInterceptor, configEsriInterceptors);

declare global {
    interface Window { 
        getCookie: (name: string) => string;
        eraseCookie: (name: string, paths: Array<string>) => void;
        setCookie: (name: string, value: string, days?: number) => void;
     }
}
declare var webpack: { core: string, production: boolean, configFile: string }

initConfig.resolveConfig(webpack.configFile).then(appConfig => {
    extendNls(nls);
    ReactDOM.render(<Provider store={initConfig.configureStore(rootReducer, webpack.production)}><App /></Provider>,document.getElementById("app"));
})