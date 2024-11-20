class D3Barras {
  constructor(barras) {
    this.barras = barras;
    this.data = [];
    this.categories = [];
    this.categoryProfits = {};


    this.w = barras.width;
    this.h = barras.height;
    this.margin = barras.margin;  // margens 
    this.createSvg();
  }

  createSvg() {
    this.svg = d3.select(this.barras.div)
      .append("svg")
      .attr('width', this.w + this.margin.left + this.margin.right)
      .attr('height', this.h + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`);
  }

  async loadCSV(file) {
    this.data = await d3.csv(file, d => ({
      category: d.Category,
      profit: +d.Profit
    }));
  }

  computeBarras() {
    this.categoryProfits = {}
    this.data.forEach(d => {
      if (!this.categoryProfits[d.category]) {
        this.categoryProfits[d.category] = 0;
      }
      this.categoryProfits[d.category] += d.profit;
    });

    this.categories = Object.keys(this.categoryProfits).sort();

    this.xScale = d3.scaleBand()
      .domain(this.categories)
      .range([0, this.w])
      .padding(0.1);

    this.yScale = d3.scaleLinear()
      .domain([0, d3.max(Object.values(this.categoryProfits))])
      .range([this.h, 0]);
  }


  render() {
    // Atualiza ou cria as barras
    this.svg.selectAll('rect')
      .data(this.categories)
      .join(
        enter => enter.append('rect')
          .attr('x', d => this.xScale(d))
          .attr('y', this.h) // Inicia as novas barras na base
          .attr('width', this.xScale.bandwidth())
          .attr('height', 0) // Altura inicial 0 para animação
          .style('fill', 'RoyalBlue')
          .call(enter => enter.transition().duration(500)
            .attr('y', d => this.yScale(this.categoryProfits[d]))
            .attr('height', d => this.h - this.yScale(this.categoryProfits[d]))),

        update => update
          .call(update => update.transition().duration(500)
            .attr('x', d => this.xScale(d))
            .attr('y', d => this.yScale(this.categoryProfits[d]))
            .attr('width', this.xScale.bandwidth())
            .attr('height', d => this.h - this.yScale(this.categoryProfits[d]))),

        exit => exit
          .call(exit => exit.transition().duration(500)
            .attr('y', this.h)
            .attr('height', 0)
            .remove())
      );

    // Atualiza ou cria os rótulos das barras
    this.svg.selectAll('text.label')
      .data(this.categories)
      .join(
        enter => enter.append('text')
          .attr('class', 'label')
          .attr('x', d => this.xScale(d) + this.xScale.bandwidth() / 2)
          .attr('y', this.h) // Começa na base da barra
          .attr('text-anchor', 'middle')
          .text(d => this.categoryProfits[d].toFixed(2))
          .call(enter => enter.transition().duration(500)
            .attr('y', d => this.yScale(this.categoryProfits[d]) - 5)),

        update => update
          .call(update => update.transition().duration(500)
            .attr('x', d => this.xScale(d) + this.xScale.bandwidth() / 2)
            .attr('y', d => this.yScale(this.categoryProfits[d]) - 5)
            .text(d => this.categoryProfits[d].toFixed(2))),

        exit => exit.remove()
      );

    // Atualiza ou cria o eixo X
    if (!this.svg.select(".x-axis").node()) {
      this.svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${this.h})`);
    }
    this.svg.select(".x-axis")
      .transition().duration(500)
      .call(d3.axisBottom(this.xScale));

    // Atualiza ou cria o eixo Y
    if (!this.svg.select(".y-axis").node()) {
      this.svg.append("g")
        .attr("class", "y-axis");
    }
    this.svg.select(".y-axis")
      .transition().duration(500)
      .call(d3.axisLeft(this.yScale));

    // Atualiza ou cria os títulos (evita duplicações)
    if (!this.svg.select(".chart-title").node()) {
      this.svg.append("text")
        .attr("class", "chart-title")
        .attr("text-anchor", "middle")
        .attr("x", this.w / 2)
        .attr("y", -this.margin.top / 2)
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Lucro Total por Categoria");
    }

    if (!this.svg.select(".x-label").node()) {
      this.svg.append("text")
        .attr("class", "x-label")
        .attr("text-anchor", "middle")
        .attr("x", this.w / 2)
        .attr("y", this.h + this.margin.bottom - 10)
        .text("Category");
    }

    if (!this.svg.select(".y-label").node()) {
      this.svg.append("text")
        .attr("class", "y-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -this.h / 2)
        .attr("y", -this.margin.left + 20)
        .text("Profit");
    }
  }


}

class Dispersao {
  constructor(config) {
    this.config = config;

    this.svg = null;
    this.margins = null;
    this.xScale = null;
    this.yScale = null;
    this.circles = [];

    this.createSvg();
    this.createMargins();
  }

  createSvg() {
    this.svg = d3.select("#disper")
      .append("svg")
      .attr('width', this.config.width + this.config.left + this.config.right)
      .attr('height', this.config.height + this.config.top + this.config.bottom);
  }

  createMargins() {
    this.margins = this.svg
      .append('g')
      .attr("transform", `translate(${this.config.left},${this.config.top})`);

    this.svg.append("text")
      .attr("x", (this.config.width + this.config.left + this.config.right) / 2)
      .attr("y", this.config.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-weight", "bold")
      .text("Gráfico de Dispersão: Lucro por Venda");
  }

  async loadCSV(file) {
    this.circles = await d3.csv(file, d => ({
      cx: +d.Sales,  // Certifique-se de que 'Sales' é um número
      cy: +d.Profit, // Certifique-se de que 'Profit' é um número
      col: +d.Discount, // Certifique-se de que 'Discount' é um número
      cat: d.Category, // 'Category' pode ser uma string
      r: 4
    }));

    // Limitação de renderização para evitar muitos dados
    this.circles = this.circles.slice(0, 1000);

    // Verificando os dados carregados
    console.log(this.circles);

    this.createScales();
    this.createAxis();
    this.renderCircles(); // Certifique-se de chamar renderCircles após os dados serem carregados
  }

  createScales() {
    const xExtent = d3.extent(this.circles, d => d.cx);
    const yExtent = d3.extent(this.circles, d => d.cy);
    const colExtent = d3.extent(this.circles, d => d.col);
    const categories = [...new Set(this.circles.map(d => d.cat))];

    // Verifique as extensões antes de definir as escalas
    console.log("xExtent:", xExtent);
    console.log("yExtent:", yExtent);
    console.log("colExtent:", colExtent);

    this.xScale = d3.scaleLinear().domain(xExtent).nice().range([0, this.config.width]);
    this.yScale = d3.scaleLinear().domain(yExtent).nice().range([this.config.height, 0]);
    this.colScale = d3.scaleSequential(d3.interpolateOrRd).domain(colExtent);
    this.catScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
  }

  createAxis() {
    const xAxis = d3.axisBottom(this.xScale).ticks(15);
    const yAxis = d3.axisLeft(this.yScale).ticks(15);

    this.margins
      .append("g")
      .attr("transform", `translate(0,${this.config.height})`)
      .call(xAxis);

    this.margins
      .append("g")
      .call(yAxis);

    // Label do eixo X
    this.svg.append("text")
      .attr("x", this.config.left + this.config.width / 2)
      .attr("y", this.config.height + this.config.top + 35)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Vendas");

    // Label do eixo Y
    this.svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -this.config.top - this.config.height / 2)
      .attr("y", this.config.left - 40)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .text("Lucro");
  }

  renderCircles() {
    // Verifique se 'this.circles' não está vazio ou indefinido
    if (!this.circles || this.circles.length === 0) {
      console.error("Dados de círculos estão vazios ou não definidos!");
      return;
    }

    const circlesSelection = this.margins.selectAll('circle')
      .data(this.circles, d => d.cx); // Usando cx como chave para garantir uma boa associação

    circlesSelection
      .enter()
      .append('circle')
      .attr('cx', d => this.xScale(d.cx))
      .attr('cy', d => this.yScale(d.cy))
      .attr('r', d => d.r)
      .attr('fill', d => this.colScale(d.col))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    // Atualização dos círculos
    circlesSelection
      .transition().duration(500)
      .attr('cx', d => this.xScale(d.cx))
      .attr('cy', d => this.yScale(d.cy));

    // Remover círculos antigos
    circlesSelection
      .exit()
      .transition().duration(500)
      .attr('r', 0)
      .remove();
  }
}






class Heatmap {
  constructor(config) {
    this.config = config;
    this.svg = null;
    this.margins = null;
    this.xScale = null;
    this.yScale = null;
    this.colorScale = null;
    this.data = [];
    this.createSvg();
    this.createMargins();
  }



  createSvg() {
    this.svg = d3.select(this.config.div)
      .append("svg")
      .attr('width', this.config.width + this.config.left + this.config.right)
      .attr('height', this.config.height + this.config.top + this.config.bottom);
  }

  createMargins() {
    this.margins = this.svg.append('g')
      .attr("transform", `translate(${this.config.left},${this.config.top})`);
  }

  convertDate(dateStr) {
    // Verificar se o delimitador é "/" ou "-"
    const delimiter = dateStr.includes("/") ? "/" : "-";

    // Dividir a data com o delimitador correto
    const [day, month, year] = dateStr.split(delimiter);

    // Retornar a data formatada como "yyyy-mm-dd"
    return new Date(`${year}-${month}-${day}`);
  }

  async loadCSV(file) {
    const data = await d3.csv(file);

    console.log('Dados carregados:', data);

    // Criar uma estrutura de dados apropriada para o heatmap
    this.data = data.map(d => {
      const date = this.convertDate(d['Order Date']);
      const year = date.getFullYear();
      const quantity = +d.Quantity;
      return { category: d.Category, year: year, quantity: quantity };
    });

    console.log('Dados processados:', this.data);

    // Criar as escalas
    this.createScales();

    // Renderizar o gráfico
    this.render();
  }

  createScales() {
    // Obter categorias e anos únicos
    const categories = Array.from(new Set(this.data.map(d => d.category)));
    const years = Array.from(new Set(this.data.map(d => d.year)));

    console.log('Categorias:', categories);
    console.log('Anos:', years);

    // Calcular o valor máximo de Quantity para a escala de cores
    const maxQuantity = d3.max(this.data, d => d.quantity);
    console.log('Max Quantity:', maxQuantity);

    // Escala para o eixo X (Categorias)
    this.xScale = d3.scaleBand()
      .domain(categories)
      .range([0, this.config.width])
      .padding(0.05);

    // Escala do eixo Y (Anos)
    this.yScale = d3.scaleBand()
      .domain(years)
      .range([0, this.config.height])
      .padding(0.05);

    // Escala de cor com base no valor de Quantity
    this.colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
      .domain([0, maxQuantity]);

    console.log('Escalas:', this.xScale.domain(), this.yScale.domain(), this.colorScale.domain());
  }

  render() {
    // Adicionar o título
    this.svg.append("text")
      .attr("x", this.config.width / 2 + this.config.left)
      .attr("y", this.config.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Heatmap: Quantidade por Categoria e Ano");

    // Gerar as células do gráfico de calor
    this.margins.selectAll('rect')
      .data(this.data)
      .join('rect')
      .attr('x', d => this.xScale(d.category))
      .attr('y', d => this.yScale(d.year))
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .style('fill', d => this.colorScale(d.quantity))
      .attr('stroke', 'white');

    // Adicionar os valores de Quantity dentro das células
    // this.margins.selectAll('text')
    //   .data(this.data)
    //   .join('text')
    //   .attr('x', d => this.xScale(d.category) + this.xScale.bandwidth() / 2)
    //   .attr('y', d => this.yScale(d.year) + this.yScale.bandwidth() / 2)
    //   .attr('text-anchor',)
    //   .attr('dy', '.35em')
    //   .style('fill', 'black')
    //   .text(d => d.quantity.toFixed(0));

    // Adicionar os eixos X e Y
    this.margins.append("g")
      .attr("transform", `translate(0,${this.config.height})`)
      .call(d3.axisBottom(this.xScale));

    this.margins.append("g")
      .call(d3.axisLeft(this.yScale));



  }
}


















async function main() {
  // Gráfico de barras
  let bc = { div: '#barChart', width: 450, height: 250, margin: { top: 50, right: 50, bottom: 50, left: 70 } };
  let app = new D3Barras(bc); // Corrigir o id

  try {
    await app.loadCSV('./datasets/superstore.csv');
    app.computeBarras();
    app.render();
  } catch (error) {
    console.error('Erro ao carregar ou renderizar o gráfico de barras', error);
  }

  // Gráfico de dispersão
  let disper = { div: '#disper', width: 450, height: 250, top: 30, left: 50, bottom: 50, right: 30 };
  let dispersao = new Dispersao(disper);

  try {
    await dispersao.loadCSV('./datasets/superstore.csv');
    dispersao.createScales();
    dispersao.createAxis();
    dispersao.renderCircles();
  } catch (error) {
    console.error('Erro ao carregar ou renderizar o gráfico de dispersão', error);
  }

  // Mapa de matriz de calor (heatmap)
  let heatmapConfig = { div: '#heatmap', width: 500, height: 300, top: 50, left: 50, bottom: 50, right: 30 };

  let heatmap = new Heatmap(heatmapConfig);

  try {
    await heatmap.loadCSV('./datasets/superstore.csv');
    heatmap.createScales();
    heatmap.render();
  } catch (error) {
    console.error('Erro ao carregar ou renderizar o gráfico de calor', error);
  }


}




main();