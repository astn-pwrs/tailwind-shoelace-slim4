<?php

namespace App\API;

use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Psr\Log\LoggerInterface;
use App\Service\EpubService;

final class EpubController
{
  private EpubService $epub;
  private LoggerInterface $logger;
  public function __construct(EpubService $epub, LoggerInterface $logger){

    $this->epub   = $epub;
    $this->logger = $logger;
  }

  public function setup(Request $request, Response $response): Response
  {
    $params = (array)$request->getParsedBody();
    try {
      $result = $this->epub->setup($params);
      $message = ['message' => $request];
      $response->getBody()->write(json_encode($message)); 
      return $response->withHeader('Content-Type', 'application/json');
    }
    catch(Exception $e) {
      $error = ['error' => $e];
      $response->getBody()->write(json_encode($error)); 
      return $response->withHeader('Content-Type', 'application/json');      
    }
  }
}
