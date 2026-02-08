<?php

namespace App\View;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

use App\Renderer\TemplateRenderer;
use Psr\Log\LoggerInterface;

class EpubController
{
  private TemplateRenderer $renderer;
  private LoggerInterface $logger;
  public function __construct(TemplateRenderer $renderer, $logger)
  {
    $this->renderer = $renderer;
    $this->logger   = $logger;
  }
  public function view(Request $request, Response $response): Response
  {
    //$this->logger->info("Home");
    $viewData = [];
    return $this->renderer->render($response, 'pages/epub.latte', $viewData);    
  }
}