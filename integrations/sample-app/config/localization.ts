import {
  findProjectRoot,
  LocalizationOptions,
  registerNamespace,
} from '@intentjs/core';
import { join } from 'path';

export default registerNamespace(
  'localization',
  (): LocalizationOptions => ({
    /**
     * -----------------------------------------------------
     * Locale Path
     * -----------------------------------------------------
     * Documentation - https://tryintent.com/docs/localization
     *
     * This value is the name of the default disk. This will be
     * used when you use the `Storage` facade to access your
     * files.
     */
    path: join(findProjectRoot(), 'resources/lang'),

    /**
     * -----------------------------------------------------
     * Fallback Lang
     * -----------------------------------------------------
     *
     * This value is used to define the default lang that
     * will be used when you are using translations in your app.
     */
    fallbackLang: 'en',
  }),
);
