import {HttpApplication} from '@themost/web';
import {resolve} from 'path';
import {LocalizationStrategy, I18nLocalizationStrategy} from '@themost/web';
// initialize app
const app = new HttpApplication(resolve(__dirname));
// set static content
app.useStaticContent(resolve('./app'));
// use i18n localization strategy as default localization strategy
app.useStrategy(LocalizationStrategy, I18nLocalizationStrategy);
// export app
module.exports = app;
