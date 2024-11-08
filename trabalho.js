class D3Barras {
    constructor(barras) {
      this.barras = barras;
      this.data = [];
      this.categories = [];
      this.categoryProfits = {};
  
      this.w = 700;
      this.h = 500;
      this.margin = { top: 50, right: 30, bottom: 50, left: 70 };  // margens 
      this.createSvg();
    }
  
    createSvg() {
      this.svg = d3.select("#main")
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
        .join('rect')
        .attr('x', d => this.xScale(d))
        .attr('y', d => this.yScale(this.categoryProfits[d]))
        .attr('width', this.xScale.bandwidth())
        .attr('height', d => this.h - this.yScale(this.categoryProfits[d]))
        .style('fill', 'RoyalBlue'); // Estilo exemplo professor
  
      // Adiciona os valores de Profit no topo das barras
      this.svg.selectAll('text.label')
        .data(this.categories)
        .join('text')
        .attr('class', 'label')
        .attr('x', d => this.xScale(d) + this.xScale.bandwidth() / 2)
        .attr('y', d => this.yScale(this.categoryProfits[d]) - 5)
        .attr('text-anchor', 'middle')
        .text(d => this.categoryProfits[d].toFixed(2));  // Formato de duas casas decimais
  
      // Adiciona o eixo X
      this.svg.append("g")
        .attr("transform", `translate(0,${this.h})`)
        .call(d3.axisBottom(this.xScale)) 
        .selectAll("text")
        .attr("dy", "1em");
  
      // Adiciona o eixo Y
      this.svg.append("g")
        .call(d3.axisLeft(this.yScale)); // Marcadores no eixo Y
  
      // Llabel do eixo X
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", this.w / 2)
        .attr("y", this.h + this.margin.bottom - 10)
        .text("Category");
  
      // label do eixo Y
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -this.h / 2)
        .attr("y", -this.margin.left + 20)
        .text("Profit");
  
      // titulo do grafico barras
      this.svg.append("text")
        .attr("text-anchor", "middle")
        .attr("x", this.w / 2)
        .attr("y", -this.margin.top / 2)
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .text("Lucro Total por Categoria");
    }
  }
  

  class ScatterPlot {
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
      this.svg = d3.select(this.config.div)
        .append("svg")
        .attr('width', this.config.width + this.config.left + this.config.right)
        .attr('height', this.config.height + this.config.top + this.config.bottom);
    }
  
    createMargins() {
      this.margins = this.svg
        .append('g')
        .attr("transform", `translate(${this.config.left},${this.config.top})`)
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
  
      //ESPECIE DE LIMITAÇÃO DE RENDER
      this.circles = this.circles.slice(0, 1000);
    }
  
    createScales() {
      const xExtent = d3.extent(this.circles, d => d.cx);
      const yExtent = d3.extent(this.circles, d => d.cy);
      const colExtent = d3.extent(this.circles, d => d.col);
      const categories = [...new Set(this.circles.map(d => d.cat))];
  
      this.xScale = d3.scaleLinear().domain(xExtent).nice().range([0, this.config.width]);
      this.yScale = d3.scaleLinear().domain(yExtent).nice().range([this.config.height, 0]);
      this.colScale = d3.scaleSequential(d3.interpolateOrRd).domain(colExtent);
      this.catScale = d3.scaleOrdinal().domain(categories).range(d3.schemeTableau10);
    }
    // D3JS (EIXOS) - PROFESSOR
    createAxis() {
        let xAxis = d3.axisBottom(this.xScale)
        .ticks(15);
  
      let yAxis = d3.axisLeft(this.yScale)
        .ticks(15);
  
      this.margins
        .append("g")
        .attr("transform", `translate(0,${this.config.height})`)
        .call(xAxis);
  
      this.margins
        .append("g")
        .call(yAxis);
    }
  
    renderCircles() {
      this.margins.selectAll('circle')
        .data(this.circles)
        .join('circle')
        .attr('cx', d => this.xScale(d.cx))
        .attr('cy', d => this.yScale(d.cy))
        .attr('r', d => d.r)
        .attr('fill', d => this.colScale(d.col))
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);
    }
  }
  
  async function main() {
    let app = new D3Barras();
    
    await app.loadCSV('../00 - datasets/superstore.csv');
    app.computeBarras();
    app.render()


    let config = {div: '#main', width: 700, height: 500, top: 30, left: 50, bottom: 30, right: 30};
  
    let scatterPlot = new ScatterPlot(config);
    await scatterPlot.loadCSV('../00 - datasets/superstore.csv'); 
    scatterPlot.createScales();
    scatterPlot.createAxis();
    scatterPlot.renderCircles();
  }
  
  main();