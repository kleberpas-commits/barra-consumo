# barra-consumo

Mod do Claude Code que mostra, logo acima do campo do prompt, duas barras de progresso com o consumo do plano: a janela de 5 horas e a janela semanal. Cada barra traz o percentual usado e o tempo até o reinício, e muda de cor conforme o uso (verde, amarelo a partir de 50%, vermelho a partir de 80%).

A barra se atualiza sozinha quando uma janela avança um ponto inteiro. Em contas sem limites de assinatura (por exemplo, API), a faixa não aparece.

Funciona no terminal e no app desktop do Claude Code. As demais superfícies (VS Code, celular, navegador) não desenham essa faixa.

## Instalação

No prompt de uma sessão de terminal do Claude Code:

```
/plugin install barra-consumo --marketplace kleberpas-commits/barra-consumo
```

Responda `y` para adicionar o marketplace e escolha o escopo **user** para valer em todos os projetos e sessões. O repositório é privado: é preciso ter o GitHub configurado no computador (`gh auth login`).
