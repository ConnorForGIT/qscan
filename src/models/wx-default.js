const pkgJSON = require('../../package.json');
const CONST = require(`./wx_default_cfg/wx_${pkgJSON.support_wx_version}`);
const shelljs = require('shelljs');
const logger = require('../logger');
const path = require('path');
const fs = require('fs');

// 定位元素超时时间
const waitTimeout = 5 * 1000;
// 判断元素是否存在超时时间
const checkElTimeout = 3 * 1000;
// 微信apk下载地址
const wxInstallUrl =
    'http://yapkwww.cdn.anzhi.com/data4/apk/201808/20/21134e06c366c63faace92226d3124bb_29305400.apk';

module.exports = {
    // Model Name 默认的微信的配置
    name: 'wx-default',
    // 参数，包括用户名，密码等
    opts: {},
    // Appium 连接参数
    connectOpt: {
        platformName: 'Android',
        deviceName: 'Android',
        appPackage: 'com.tencent.mm',
        appActivity: '.ui.LauncherUI',
        noReset: 'true',
        fullReset: 'false',
        fastReset: 'false'
    },
    // 等待超时时间
    waitTimeout,
    // 检查 App 是否是相应的版本等
    checkApp: (cb, udid) => {
        const version = pkgJSON.support_wx_version;
        let currentVersion = shelljs
            .exec(
                `adb -s ${udid} shell pm dump com.tencent.mm | grep "versionName"`,
                {
                    silent: true
                }
            )
            .stdout.trim();

        currentVersion =
            currentVersion && currentVersion.match(/\w=([0-9.]+)/)[1];

        if (!currentVersion || currentVersion !== version) {
            logger.warn(`Need version-${version} wechat app`);
            logger.info(`installing ${version} wechat...`);
            // install wx
            const apksPath = path.join(__dirname, '../apks');

            if (!fs.existsSync(`${apksPath}/wx.apk`)) {
                shelljs.exec(`mkdir ${apksPath}`);
                shelljs.exec(`curl -o ${apksPath}/wx.apk  ${wxInstallUrl}`);
            }

            if (currentVersion > version) {
                shelljs.exec(
                    `adb -s ${udid} uninstall com.tencent.mm`,
                    { silent: true },
                    (code, stdout, stderr) => {
                        if (stderr) {
                            cb(
                                `Can Not Uninstall wechat-${currentVersion}, please uninstall manually`
                            );
                        }
                    }
                );
            }

            if (
                shelljs.exec(`adb -s ${udid} install -r ${apksPath}/wx.apk`, {
                    silent: true
                }).code === 0
            ) {
                logger.success(`install wechat-${version} success`);
                cb(null);
            } else {
                cb(`Need wechat-${version}, please install manually `);
            }
        } else {
            logger.success('The app version is ok');
            cb(null);
        }
    },

    // 检查状态是否正确，包括登录的用户是指定用户等
    checkStatus: (app, opts, cb) => {
        logger.await('启动中...');

        app.waitForElementById(CONST.WAIT_FINISHED.id) // 使用ById适配View ViewGroup
            .then(() => logger.primary('开始检测登录状态'))
            .setImplicitWaitTimeout(checkElTimeout)
            .elementByXPathIfExists(CONST.TAB_4.xpath, (err, el) => {
                if (el) {
                    logger.info('已登录! 检测账号是否一致');

                    el.click()
                        .elementByXPath(CONST.WX_USERNAME.xpath)
                        .text()
                        .then(text => {
                            if (text === '微信号：' + opts.user) {
                                logger.success('一致! 可扫码');
                                cb(null, app);
                            } else {
                                logger.warn('不一致! 退出重新登录');
                                logout(app, () => relogin(app, opts, cb));
                            }
                        });
                } else {
                    logger.warn('未登录! 检测是否存在缓存登录');

                    app.elementByXPathIfExists(
                        CONST.LAST_WX_USERNAME.xpath,
                        (err, el) => {
                            if (el) {
                                logger.info('存在, 检测账号是否一致');

                                el.text().then(text => {
                                    if (text === opts.user) {
                                        logger.success('一致! 再次登录');
                                        repeatLogin(app, opts, cb);
                                    } else {
                                        logger.warn('不一致! 重新登录');
                                        relogin(app, opts, cb);
                                    }
                                });
                            } else {
                                logger.info('不存在');
                                // 首页登录
                                init(app, opts, cb);
                            }
                        }
                    );
                }
            })
            .catch(err => {
                cb(err);
            });
    },
    // 不同类型的扫码
    types: {
        // 开发者工具登录
        'ide-login-scan': (app, opts, cb) => {
            logger.info('扫码类型: 开发者工具');

            return app
                .setImplicitWaitTimeout(waitTimeout)
                .waitForElementByXPath(CONST.THE_MORE_BTN.xpath)
                .click()
                .elementByXPath(CONST.THE_SCAN_BTN.xpath)
                .click()
                .waitForElementByXPath(CONST.IDE_AFTER_SCAN.xpath)
                .click();
        },
        // 微信后台登录
        'backstage-login-scan': (app, opts, cb) => {
            logger.info('扫码类型: 微信后台');

            return app
                .setImplicitWaitTimeout(waitTimeout)
                .waitForElementByXPath(CONST.THE_MORE_BTN.xpath)
                .click()
                .elementByXPath(CONST.THE_SCAN_BTN.xpath)
                .click()
                .waitForElementByXPath(CONST.MP_AFTER_SCAN.xpath)
                .click();
        }
    }
};
// 检测元素是否消失
const hasDisappeared = (app, xpath, cb) => {
    app.setImplicitWaitTimeout(1000)
        .elementByXPathIfExists(xpath)
        .then(el => {
            if (el) {
                setTimeout(() => {
                    hasDisappeared(app, xpath, cb);
                }, 1000);
            } else {
                cb();
            }
        });
};

// 初始化 App，从打开、登录到主界面
const init = (app, opts, cb) => {
    logger.primary('首页登录');

    app.setImplicitWaitTimeout(waitTimeout)
        .elementByXPath(CONST.INDEX_LOGIN_BTN.xpath)
        .click()
        .then(() => login(app, opts, cb))
        .catch(err => cb(err));
};

const login = (app, opts, cb) => {
    logger.info('登录中...');

    app.setImplicitWaitTimeout(waitTimeout)
        .elementByXPath(CONST.USE_USER_AND_PASSWORD.xpath)
        .click()
        .elementByXPath(CONST.USERNAME_INPUT.xpath)
        .sendKeys(opts.user)
        .elementByXPath(CONST.PASSWORD_INPUT.xpath)
        .sendKeys(opts.pass)
        .elementByXPath(CONST.DO_LOGIN_BTN.xpath)
        .click()
        .waitForElementByXPath(CONST.PROGRESS_BAR.xpath)
        .then(() =>
            hasDisappeared(app, CONST.PROGRESS_BAR.xpath, () =>
                app
                    .setImplicitWaitTimeout(checkElTimeout)
                    .elementByXPathIfExists(CONST.ALERT_OK.xpath)
                    .then(el => {
                        if (el) el.click();
                    })
                    .setImplicitWaitTimeout(waitTimeout)
                    .waitForElementByXPath(CONST.TAB_1.xpath)
                    .then(() => cb(null, app))
                    .catch(err => cb(err))
            )
        );
};

// 退出登录
const logout = (app, cb) => {
    logger.info('退出登录中...');
    app.setImplicitWaitTimeout(waitTimeout)
        .elementByXPath(CONST.TAB_4.xpath)
        .click()
        .elementsByXPath(CONST.THE_LIST_ELS.xpath, (err, els) => {
            const el = els[els.length - 1];
            el.click();
        })
        .elementByXPath(CONST.THE_LIST.xpath)
        .flick(0, -500, 100)
        .elementsByXPath(CONST.THE_LIST_ELS.xpath, (err, els) => {
            const el = els[els.length - 1];
            el.click();
        })
        .elementByXPath(CONST.SETTING_EXIT.xpath)
        .click()
        .waitForElementByXPath(CONST.ALERT_OK.xpath)
        .click()
        .then(() => cb(null, app))
        .catch(err => cb(err));
};

// 重复登录
const repeatLogin = (app, opts, cb) => {
    logger.info('再次登录中...');

    app.setImplicitWaitTimeout(waitTimeout)
        .elementByXPath(CONST.PASSWORD_INPUT.xpath)
        .sendKeys(opts.pass)
        .elementByXPath(CONST.DO_LOGIN_BTN.xpath)
        .click()
        .setImplicitWaitTimeout(waitTimeout)
        .waitForElementByXPath(CONST.TAB_1.xpath)
        .then(() => cb(null, app))
        .catch(err => cb(err));
};

// 重新登录
const relogin = (app, opts, cb) => {
    logger.info('重新登录中...');

    app.setImplicitWaitTimeout(waitTimeout)
        .elementByXPath(CONST.LOGIN_MORE.xpath)
        .click()
        .waitForElementByXPath(CONST.LOGIN_OTHER.xpath)
        .click()
        .then(() => login(app, opts, cb))
        .catch(err => cb(err));
};
