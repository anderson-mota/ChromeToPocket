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
	$redirect_uri = urlencode($pocket_config['redirect_uri']);
    $request_token = connect($pocket_config['consumer_key'], $redirect_uri);
    
    $app['session']->set('request_token', $request_token);
    return $app->redirect("https://getpocket.com/auth/authorize?request_token={$request_token}&redirect_uri={$redirect_uri}");
    
})->bind('connect');

$app->get('/callback', function() use ($app, $app_url, $pocket_config) {
	
	$request_token = $app['session']->get('request_token');
    $access_token = callback($pocket_config['consumer_key'], $request_token);

    $app['session']->set('access_token', $access_token);
    return $app->redirect($app["url_generator"]->generate("index"));
    
})->bind('callback');

/**
 * @param string $consumer_key
 * @param string $request_token
 * @return string
 */
function callback($consumer_key, $request_token) {
	if (empty($request_token)) {
		throw new Exception("Undefined Token");
	}
	
	$url = 'https://getpocket.com/v3/oauth/authorize';
	$data = [
		'consumer_key' => $consumer_key, 
		'code' => $request_token
	];

	$result = remotePOST($url, $data);
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

	$result = remotePOST($url, $data);

	// our $result contains our request token
	$code = explode('=', $result);
	$request_token = $code[1];
	
	return $request_token;
}

function cURL($request_url, $params = []) {
	//$request_url = 'https://www.eventbrite.com/oauth/token';
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_POST, TRUE);
	curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
	curl_setopt($ch, CURLOPT_URL, $request_url);
	curl_setopt($ch, CURLOPT_HEADER, FALSE);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
	$response = curl_exec($ch);
	curl_close($ch);
	
	return $response;
}

function remotePOST($request_url, $params = []) {
	$options = [
		'http' => [
			'method'  => 'POST',
			'content' => http_build_query($params)
		]
	];
	$context  = stream_context_create($options);
	return file_get_contents($request_url, false, $context);
}

$app->run();
