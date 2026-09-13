Pod::Spec.new do |s|
  s.name           = 'SplitVideoEngine'
  s.version        = '0.1.0'
  s.summary        = 'Native local video processing engine for SplitVideo'
  s.description    = 'AVFoundation-based local video splitting and cropping for SplitVideo.'
  s.homepage       = 'https://splitvideo.in'
  s.license        = { :type => 'MIT' }
  s.author         = { 'SplitVideo' => 'build@splitvideo.in' }
  s.platforms      = { :ios => '15.1' }
  s.source         = { :git => 'https://github.com/deepdharia/splitvideo.git', :tag => s.version.to_s }
  s.source_files   = '**/*.{h,m,mm,swift}'
  s.swift_version  = '5.9'
  s.dependency 'ExpoModulesCore'
end
