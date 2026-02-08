<?php

namespace App\Renderer;

use Latte\Engine;
use Psr\Http\Message\ResponseInterface as Response;

final class TemplateRenderer
{
	private Engine $engine;
	public function __construct($engine)
  {
    $this->engine = $engine;
		// コンポーネント関数を登録 
		$this->engine->addFunction('renderComponent', function (string $name, array $params = [])
		{ 
			$componentPath = "components/{$name}.latte";
			// JSファイルが存在すればアセットに追加 
			return $this->engine->renderToString($componentPath, $params); 
		});

  }

	public function render(Response $response, string $template, array $data = [] ): Response
	{
		$string = $this->engine->renderToString($template, $data);
		$response->getBody()->write($string);
		return $response;
	}
}
