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
  public function top(Request $request, Response $response, $args): Response
  {
    $action = $args['action'] ?? 'top';
    $this->logger->debug("action:".$action);
    $viewData = [];
    return $this->renderer->render($response, "pages/$action.latte", $viewData);    
  }
}