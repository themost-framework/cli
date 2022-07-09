import {HttpApplication, ODataModelBuilderConfiguration, HttpServiceController} from '@themost/web';
import {resolve} from 'path';
import {TraceUtils} from '@themost/common';
import {LocalizationStrategy, I18nLocalizationStrategy} from '@themost/web';
import { ODataModelBuilder } from '@themost/data';
// initialize app
const app = new HttpApplication(resolve(__dirname));
// set static content
app.useStaticContent(resolve('./app'));
// use i18n localization strategy as default localization strategy
app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
// configure api
ODataModelBuilderConfiguration.config(app).then((builder: ODataModelBuilder) => {
    // set service root
    builder.serviceRoot = '/api/';
    // set context link
    builder.hasContextLink((context: any) => {
        return '/api/$metadata';
    });
}).catch((err) => {
    TraceUtils.error(err);
});
app.useController('service', HttpServiceController);
// export application
module.exports = app;
