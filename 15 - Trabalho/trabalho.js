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
    this.svg.selectAll('rect')
      .data(this.categories)
      .join(
        enter => enter.append('rect')
          .attr('x', d => this.xScale(d))
          .attr('y', this.h) 
          .attr('width', this.xScale.bandwidth())
          .attr('height', 0) 
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

    this.svg.selectAll('text.label')
      .data(this.categories)
      .join(
        enter => enter.append('text')
          .attr('class', 'label')
          .attr('x', d => this.xScale(d) + this.xScale.bandwidth() / 2)
          .attr('y', this.h) 
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

    if (!this.svg.select(".x-axis").node()) {
      this.svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${this.h})`);
    }
    this.svg.select(".x-axis")
      .transition().duration(500)
      .call(d3.axisBottom(this.xScale));

    if (!this.svg.select(".y-axis").node()) {
      this.svg.append("g")
        .attr("class", "y-axis");
    }
    this.svg.select(".y-axis")
      .transition().duration(500)
      .call(d3.axisLeft(this.yScale));


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
      cx: +d.Sales,  
      cy: +d.Profit, 
      col: +d.Discount, 
      cat: d.Category, 
      r: 4
    }));

    // Limitação de renderização para evitar muitos dados
    //this.circles = this.circles.slice(0, 1000);

    // Verificando os dados carregados
    console.log(this.circles);

    this.createScales();
    this.createAxis();
    this.renderCircles(); 
  }

  createScales() {
    const xExtent = d3.extent(this.circles, d => d.cx);
    const yExtent = d3.extent(this.circles, d => d.cy);
    const colExtent = d3.extent(this.circles, d => d.col);
    const categories = [...new Set(this.circles.map(d => d.cat))];

    // conferencia logs
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
    if (!this.circles || this.circles.length === 0) {
      console.error("Problema this.circles!");
      return;
    }

    const circlesSelection = this.margins.selectAll('circle')
      .data(this.circles, d => d.cx); 
    circlesSelection
      .enter()
      .append('circle')
      .attr('cx', d => this.xScale(d.cx))
      .attr('cy', d => this.yScale(d.cy))
      .attr('r', d => d.r)
      .attr('fill', d => this.colScale(d.col))
      .attr('stroke', 'black')
      .attr('stroke-width', 0.5);

    circlesSelection
      .transition().duration(500)
      .attr('cx', d => this.xScale(d.cx))
      .attr('cy', d => this.yScale(d.cy));

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
    const delimiter = dateStr.includes("/") ? "/" : "-";
    const [day, month, year] = dateStr.split(delimiter);
    return new Date(`${year}-${month}-${day}`);
  }

  async loadCSV(file) {
    const data = await d3.csv(file);

    console.log('Dados carregados:', data);

    this.data = data.map(d => {
      const date = this.convertDate(d['Order Date']);
      const year = date.getFullYear();
      const quantity = +d.Quantity;  
      return { category: d.Category, year: year, quantity: quantity };
    });

    console.log('Dados processados:', this.data);

    this.createScales();
    this.render();
  }

  createScales() {
    const categories = Array.from(new Set(this.data.map(d => d.category)));
    const years = Array.from(new Set(this.data.map(d => d.year)));
  
    console.log('Categorias:', categories);
    console.log('Anos:', years);
  
    // soma das quantidades por categoria e ano
    const aggregatedData = d3.rollup(
      this.data,
      v => d3.sum(v, d => d.quantity),
      d => d.category,
      d => d.year
    );
  
    // max e minimo
    const heatmapData = [];
    aggregatedData.forEach((yearsMap, category) => {
      yearsMap.forEach((sum, year) => {
        heatmapData.push({ category, year, quantity: sum });
        console.log(`Categoria: ${category}, Ano: ${year}, Soma: ${sum}`);
      });
    });
  
    const maxQuantity = d3.max(heatmapData, d => d.quantity);
    const minQuantity = d3.min(heatmapData, d => d.quantity);
  
    console.log('Max Quantity:', maxQuantity); //conferir se os dados estao corretos
    console.log('Min Quantity:', minQuantity);
  
    this.xScale = d3.scaleBand()
      .domain(categories)
      .range([0, this.config.width]);
  
    this.yScale = d3.scaleBand()
      .domain(years)
      .range([0, this.config.height]);
  
    this.colorScale = d3.scaleLinear()
      .domain([minQuantity, maxQuantity])  // Definindo as cores
      .range(["#eef685", "#ff0000"]);
  
    console.log('Escalas:', this.xScale.domain(), this.yScale.domain(), this.colorScale.domain());
  }

  addLegend() {
    const legendWidth = 300;  
    const legendHeight = 20; 
    const padding = 10;     
  
    const legendScale = d3.scaleLinear()
      .domain(this.colorScale.domain())
      .range([0, legendWidth]);        
  
    const defs = this.svg.append("defs");
    const linearGradient = defs.append("linearGradient")
      .attr("id", "legend-gradient");
  
    linearGradient.append("stop")
      .attr("offset", "0%")
      .attr("stop-color", this.colorScale.range()[0]); 
  
    linearGradient.append("stop")
      .attr("offset", "100%")
      .attr("stop-color", this.colorScale.range()[1]); 
  
    const legendGroup = this.margins.append("g")
    .attr("transform", `translate(${(this.config.width - legendWidth) / 2}, ${this.config.height + padding + 20})`);
  
    legendGroup.append("rect")
      .attr("width", legendWidth)
      .attr("height", legendHeight)
      .style("fill", "url(#legend-gradient)");

    const legendAxis = d3.axisBottom(legendScale)
      .ticks(5); 
  
    legendGroup.append("g")
      .attr("transform", `translate(0, ${legendHeight})`)
      .call(legendAxis);
  }

  render() {
    const aggregatedData = d3.rollup(
      this.data,
      v => d3.sum(v, d => d.quantity),
      d => d.category,
      d => d.year
    );

    // exibir as somas no console
    const heatmapData = [];
    aggregatedData.forEach((yearsMap, category) => {
      yearsMap.forEach((sum, year) => {
        heatmapData.push({ category, year, quantity: sum });
        console.log(`Categoria: ${category}, Ano: ${year}, Soma: ${sum}`);
      });
    });

    // titulo
    this.svg.append("text")
      .attr("x", this.config.width / 2 + this.config.left)
      .attr("y", this.config.top / 2)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("Heatmap: Quantidade por Categoria e Ano");

    
    this.margins.selectAll('rect')
      .data(heatmapData) 
      .join('rect')
      .attr('x', d => this.xScale(d.category))
      .attr('y', d => this.yScale(d.year))
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .style('fill', d => this.colorScale(d.quantity))  // escala de cor aqui
      .attr('stroke', 'gray')
      .attr('stroke-width', "0.5px")
      .on('mouseover', (event, d) => {
        d3.select("#tooltip")
          .style('visibility', 'visible')
          .style('border', '2px solid #333')
          .text(`Categoria: ${d.category}, Ano: ${d.year}, Soma: ${d.quantity}`);
      })
      .on('mousemove', (event) => {
        d3.select("#tooltip")
          .style('top', `${event.pageY + 10}px`)
          .style('left', `${event.pageX + 10}px`);
      })
      .on('mouseout', () => {
        d3.select("#tooltip")
          .style('visibility', 'hidden');
      });

    this.margins.append("g")
      .attr("transform", `translate(0,${this.config.height})`)
      .call(d3.axisBottom(this.xScale));

    this.margins.append("g")
      .call(d3.axisLeft(this.yScale));
      
    console.log("Escala de cores:", this.colorScale); // confirmar as cores

    this.addLegend();

    
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
  let disper = { div: '#disper', width: 450, height: 350, top: 30, left: 80, bottom: 50, right: 30 };
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
  let heatmapConfig = { div: '#heatmap', width: 500, height: 280, top: 50, left: 50, bottom: 80, right: 30 };

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