<?php
// web/index.php
require_once __DIR__.'/vendor/autoload.php';

$app_url = "https://chrometopocket-anderson-mota.c9.io/";
$pocket_config = [
    'host' => "https://getpocket.com/",
    'consumer_key' => '38238-3a41f1da78d6970fe24870f8',
    'redirect_uri' => "{$app_url}callback",
    ];

$app = new Silex\Application();
$app['debug'] = true;

$app->register(new Silex\Provider\TwigServiceProvider(), [
    'twig.path' => __DIR__.'/views',
]);
$app->register(new Silex\Provider\SessionServiceProvider());
$app->register(new Silex\Provider\UrlGeneratorServiceProvider());

$app->get('/', function() use ($app) {
    $access_token = $app['session']->get('access_token');
    return $app['twig']->render('index.twig', ['access_token' => $access_token]);
})->bind('index');

$app->get('/pocket-connect', function() use ($app, $pocket_config) {
    $request_token = connect($pocket_config['consumer_key'], $pocket_config['redirect_uri']);
    return $app->redirect("https://getpocket.com/auth/authorize?request_token={$request_token}&redirect_uri={$pocket_config['redirect_uri']}");
})->bind('connect');

$app->get('/callback', function() use ($app, $app_url) {
    $access_token = callback($app['request']->get('request_token'));
    $app['session']->set('access_token', $access_token);
    return $app->redirect($app["url_generator"]->generate("index"));
})->bind('callback');

/**
 * @param string $request_token
 * @return string
 */
function callback($request_token) {
	$url = 'https://getpocket.com/v3/oauth/authorize';
	$data = [
		'consumer_key' => $consumer_key, 
		'code' => $request_token
	];
	$options = [
		'http' => [
			'method'  => 'POST',
			'content' => http_build_query($data)
		]
	];
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);
	// our $result contains our access token
	
	$access_token = explode('&', $result);
	
	return $access_token[0];
};

/**
 * @param string $consumer_key
 * @param string $redirect_uri
 * @return string
 */
function connect($consumer_key, $redirect_uri) {
    // first, obtain a request token
	$url = 'https://getpocket.com/v3/oauth/request';
	$data = [
		'consumer_key' => $consumer_key, 
		'redirect_uri' => $redirect_uri
	];
	$options = array(
		'http' => [
			'method'  => 'POST',
			'content' => http_build_query($data)
		]
	);
	$context  = stream_context_create($options);
	$result = file_get_contents($url, false, $context);
	// our $result contains our request token
	$code = explode('=', $result);
	$request_token = $code[1];
	
	return $request_token;
}

$app->run();
