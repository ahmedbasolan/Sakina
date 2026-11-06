# Local Expo module (autolinked from modules/). Named "...Bridge" so its Swift
# module name cannot collide with the widget extension target, whose product
# and module are both "SakinaLiveActivity".
Pod::Spec.new do |s|
  s.name           = 'SakinaLiveActivityBridge'
  s.version        = '1.0.0'
  s.summary        = 'Sakina prayer Live Activity bridge'
  s.description    = 'Starts/ends the Sakina prayer Live Activity, shares the verse snapshot with the widget extension through the App Group, and forwards ActivityKit push tokens to the register endpoint.'
  s.license        = { :type => 'UNLICENSED' }
  s.author         = 'Sakina'
  s.homepage       = 'https://github.com/ahmedbasolan/Sakina'
  s.platforms      = {
    :ios => '15.1'
  }
  s.swift_version  = '5.9'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # The app deploys to iOS 15.1 and ActivityKit first ships in iOS 16.1:
  # weak-link it so the app still launches on iOS 15. Every use in Swift is
  # behind @available(iOS 17.2, *) as well.
  s.weak_framework = 'ActivityKit'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = '**/*.{h,m,swift}'
end
