import {HttpApplication, ODataModelBuilderConfiguration, HttpServiceController} from '@themost/web';
import path from 'path';
import {TraceUtils} from '@themost/common';
import {LocalizationStrategy, I18nLocalizationStrategy} from '@themost/web/localization';
// initialize app
let app = new HttpApplication(path.resolve(__dirname));
// set static content
app.useStaticContent(path.resolve('./app'));
// use i18n localization strategy as default localization strategy
app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
// configure api
ODataModelBuilderConfiguration.config(app).then((builder)=> {
    // set service root
    builder.serviceRoot = '/api/';
    // set context link
    builder.hasContextLink((context)=> {
        return '/api/$metadata';
    });
}).catch((err)=> {
    TraceUtils.error(err);
});
app.useController('service', HttpServiceController);
// export application
module.exports = app;
