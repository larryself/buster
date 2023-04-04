<template>
  <v-app id="app" v-if="dataLoaded">
    <div class="section">
      <div class="section-title" v-once>
        {{ getText('optionSectionTitle_misc') }}
      </div>
      <div class="option-wrap">
        <div class="option select">
          <vn-select
            :label="getText('optionTitle_appTheme')"
            :items="listItems.appTheme"
            v-model="options.appTheme"
          >
          </vn-select>
        </div>
        <div class="option button" v-if="enableContributions">
          <vn-button
            class="contribute-button vn-icon--start"
            @click="showContribute"
            ><vn-icon src="/src/contribute/assets/heart.svg"></vn-icon>
            {{ getText('buttonLabel_contribute') }}
          </vn-button>
        </div>
      </div>
    </div>
  </v-app>
</template>

<script>
import {toRaw} from 'vue';
import {Button, Icon, Select, Switch, TextField} from 'vueton';

import storage from 'storage/storage';
import {getListItems, showContributePage, pingClientApp} from 'utils/app';
import {getText} from 'utils/common';
import {enableContributions, clientAppVersion} from 'utils/config';
import {
  optionKeys,
  clientAppPlatforms,
  captchaWitSpeechApiLangCodes,
  microsoftSpeechApiRegions
} from 'utils/data';

export default {
  components: {
    [Button.name]: Button,
    [Icon.name]: Icon,
    [Select.name]: Select,
    [Switch.name]: Switch,
    [TextField.name]: TextField
  },

  data: function () {
    return {
      dataLoaded: false,

      listItems: {
        ...getListItems(
          {
            speechService: [
              'witSpeechApiDemo',
              'googleSpeechApi',
              'witSpeechApi',
              'ibmSpeechApi',
              'microsoftSpeechApi'
            ]
          },
          {scope: 'optionValue_speechService'}
        ),
        ...getListItems(
          {microsoftSpeechApiLoc: microsoftSpeechApiRegions},
          {scope: 'optionValue_microsoftSpeechApiLoc'}
        ),
        ...getListItems(
          {
            witSpeechApiLang: [
              ...new Set(
                Object.values(captchaWitSpeechApiLangCodes).filter(Boolean)
              )
            ].sort()
          },
          {scope: 'optionValue_witSpeechApiLang'}
        ),
        ...getListItems(
          {appTheme: ['auto', 'light', 'dark']},
          {scope: 'optionValue_appTheme'}
        )
      },

      enableContributions,

      witSpeechApiLang: null,
      witSpeechApis: [],

      clientAppVerified: false,
      clientAppInstalled: false,
      clientAppDownloadUrl: '',
      installGuideUrl: '',

      options: {
        speechService: '',
        googleSpeechApiKey: '',
        ibmSpeechApiUrl: '',
        ibmSpeechApiKey: '',
        microsoftSpeechApiLoc: '',
        microsoftSpeechApiKey: '',
        witSpeechApiKeys: {},
        loadEnglishChallenge: false,
        tryEnglishSpeechModel: false,
        simulateUserInput: false,
        autoUpdateClientApp: false,
        navigateWithKeyboard: false,
        appTheme: '',
        showContribPage: false
      }
    };
  },

  methods: {
    getText,

    verifyClientApp: async function () {
      try {
        await pingClientApp();
        this.clientAppInstalled = true;
      } catch (err) {
        if (!this.installGuideUrl) {
          this.installGuideUrl =
            'https://github.com/dessant/buster/wiki/Installing-the-client-app';
          const {os, arch} = this.$env;
          if (clientAppPlatforms.includes(`${os}/${arch}`)) {
            this.installGuideUrl += `#${os}`;
            this.clientAppDownloadUrl = `https://github.com/dessant/buster-client/releases/download/v${clientAppVersion}/buster-client-setup-v${clientAppVersion}-${os}-${arch}`;
            if (os === 'windows') {
              this.clientAppDownloadUrl += '.exe';
            }
          }
        }

        this.clientAppInstalled = false;
      }

      this.clientAppVerified = true;
    },

    setWitSpeechApiLangOptions: function () {
      this.listItems.witSpeechApiLang = this.listItems.witSpeechApiLang.filter(
        item => !this.witSpeechApis.includes(item.value)
      );
    },

    addWitSpeechApi: function () {
      this.witSpeechApis.push(this.witSpeechApiLang);
      this.witSpeechApiLang = null;
      this.setWitSpeechApiLangOptions();
    },

    saveWitSpeechApiKey: function (value, lang) {
      const apiKeys = this.options.witSpeechApiKeys;
      if (value) {
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys, {
          [lang]: value
        });
      } else if (apiKeys[lang]) {
        delete apiKeys[lang];
        this.options.witSpeechApiKeys = Object.assign({}, apiKeys);
      }
    },

    showContribute: async function () {
      await showContributePage();
    }
  },

  created: async function () {
    const options = await storage.get(optionKeys);

    for (const option of Object.keys(this.options)) {
      this.options[option] = options[option];

      this.$watch(
        `options.${option}`,
        async function (value) {
          await storage.set({[option]: toRaw(value)});
          await browser.runtime.sendMessage({id: 'optionChange'});
        },
        {deep: true}
      );
    }

    this.witSpeechApis = Object.keys(options.witSpeechApiKeys);
    this.setWitSpeechApiLangOptions();

    document.title = getText('pageTitle', [
      getText('pageTitle_options'),
      getText('extensionName')
    ]);

    this.verifyClientApp();

    this.dataLoaded = true;
  }
};
</script>

<style lang="scss">
@use 'vueton/styles' as vueton;

@include vueton.theme-base;

.v-application__wrap {
  display: grid;
  grid-row-gap: 32px;
  grid-column-gap: 48px;
  padding: 24px;
  grid-auto-rows: min-content;
  grid-auto-columns: min-content;
}

.section-title {
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.25px;
  line-height: 32px;
}

.section-desc {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;

  padding-top: 8px;
  max-width: 380px;
}

.option-wrap {
  display: grid;
  grid-row-gap: 24px;
  padding-top: 24px;
}

.option {
  display: flex;
  align-items: center;
  height: 20px;

  &.button {
    height: 40px;
  }

  &.select,
  &.text-field {
    height: 56px;
  }

  & .contribute-button {
    @include vueton.theme-prop(color, primary);

    & .vn-icon {
      @include vueton.theme-prop(background-color, cta);
    }
  }
}

.text-field .v-input__control {
  width: 326px;
}

.section-client .section-desc {
  width: 272px;
}

.wit-add-api {
  display: flex;
  align-items: center;

  & .vn-select {
    & .v-input__control,
    & .v-input__details {
      max-width: calc(100vw - 48px - 124px) !important;
    }
  }

  & .vn-button {
    margin-left: 24px;
    @include vueton.theme-prop(color, primary);
  }
}

.service-guide {
  font-size: 16px;
  font-weight: 400;
  letter-spacing: 0.5px;
  line-height: 24px;
}

.client-download {
  width: 272px;
}

.download-desc,
.download-error {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc a {
  font-size: 14px;
  font-weight: 400;
  letter-spacing: 0.25px;
  line-height: 20px;
}

.download-desc {
  max-width: 240px;
}

.download-error {
  margin-top: 12px;
  @include vueton.theme-prop(color, error);
}

.download-link {
  visibility: hidden;
}

.download-button {
  margin-top: 24px;
  @include vueton.theme-prop(background-color, primary);

  & .v-btn__content {
    @include vueton.theme-prop(color, on-primary);
  }
}
</style>
