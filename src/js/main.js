
var SPEED = 20, // 飞船运行速度(px)
	ENERGY_CONSUME = 0.5, // 飞船动力系统，飞行时消耗的速度
	ENERGY_SYSTEM = 0.2, // 飞船能源系统，停止时补给的速度
	NITIAL_ENERGY = 100, // 飞船初始能量
	NITIAL_ANGLE = 90, // 飞船初始角度
	WORN_PERCENT = 0.5, // 飞船能量警告线(百分比)
	DELAY_TIME = 1000, // 介质传输消息延迟(ms)
	LOSS_RATE = 0.3; // 消息丢包率

// 飞船类构造器，统一的飞船参数
function craft(id){
    // 飞船自身信息   
    this.energy = NITIAL_ENERGY; // 初始能源
    this.angle = NITIAL_ANGLE; // 初始角度
    this.id = id; // 飞船id
    this.radius = 250 + this.id * 100; // 轨道半径    
    this.ele = $(".orbit" + this.id); // 飞船元素自身
    this.fly; // start定时器
    this.stay; // stop定时器
};

craft.prototype = {

	// ******************************
	// ******** 对外暴露接口 ********
	// ******************************	
	// 对外接收来自Commander的关于哪类消息的信息
	rcvCommand: function(msg){

		var type = msg.type;

		if (this.fly) {
			clearInterval(this.fly);
		}

		if (this.stay) {
			clearInterval(this.stay);
		}

		switch (type){
			case "create":
				this.createCraft();
				break;
			case "start":
				this.moveCraft();				
				break;
			case "stop":
				this.stopCraft();				
				break;								
			case "destroy":
				this.destroyCraft();
				break;	
			default:
				break;					
		}

		// 操作控制台打印消息
		printer.getInfo(msg, "飞船");
	},

	// ******************************
	// ******** 内置私有函数 ********
	// ******************************
	// 飞船开始飞行
	moveCraft: function(){
		var that = this;

		// 飞行时每秒都消耗能量
		this.fly = setInterval(function(){
			that.energy -= ENERGY_CONSUME;

			// 可能的行为切换(能量消耗完,则停止飞行)
			if(Math.round(that.energy) == 0){
				that.stopCraft();
				clearInterval(that.fly);
			}

			// 飞船执行飞行 
			that.angle += (SPEED * 360) / (2 * Math.PI * that.radius);
			that.ele.find(".craft" + that.id).css("transform", "rotate(" + that.angle + "deg)");
			// 样式渲染
			that.craftStateShow(that.energy);

		}, 500);
		
	},

	// 飞船停止飞行
	stopCraft: function(){
		var that = this;

		// 停止时每秒都补充能量
		this.stay = setInterval(function(){
			that.energy += ENERGY_SYSTEM;

			// 可能的行为切换(能量补充满,则不再补能量)
			if(Math.round(that.energy) >= NITIAL_ENERGY){
				clearInterval(that.stay);
			}

			// 样式渲染
			that.craftStateShow(that.energy);
		}, 500);
	},

	// **********************
	// ******** view ********
	// **********************	
	// 飞船存在时，能量情况调整
	craftStateShow: function(energy){
		var $energyEle = this.ele.find(".energy"),
			$energyText = this.ele.find(".energyText");

		if (energy  >= 0 &&  energy <= NITIAL_ENERGY) {
			// 设置能量条长度和能量条数字显示
			$energyEle.css("width", energy + "%");
			$energyText.text(Math.round(energy));

			// 能量小于一定值时能量条背景色改变
			if(energy < NITIAL_ENERGY * WORN_PERCENT){
				$energyEle.addClass("lack");
			} else {
				$energyEle.removeClass("lack");
			}			
		} else {
			console.log("The energy is out of range!The craft can't be displayed!" + energy);
		}

	},

	// 飞船初始位置创建
	createCraft: function(){
		var craftTemplate = Handlebars.compile($("#craftTemplate").html()),
			content = {
				id: this.id
			};

		this.ele.html(craftTemplate(content));
	},

	// 飞船原地销毁
	destroyCraft: function(){

		this.ele.empty();
		// 恢复初始能量和角度
		this.energy = NITIAL_ENERGY;
		this.angle = NITIAL_ANGLE;
	}
};


// 指挥官构造器
function commander(){

}

commander.prototype = {

	// ******************************
	// ******** 对外暴露接口 ********
	// ******************************	
	// 对外(Mediator)发送封装好的信息
	sendInfo: function(msg){ 
		// 操作控制台打印消息
		printer.getInfo(msg, "指挥官");

		// 向Mediator发送消息
		med.trans(msg);
	}
}


// 介质层Mediator构造器
function mediator(){

}

mediator.prototype = {
	// ******************************
	// ******** 对外暴露接口 ********
	// ******************************
	// 执行消息处理(丢包)和转发
	trans: function (msg) {
		var success = Math.random() > LOSS_RATE ? true : false,
			that = this;

		// 介质传输消息延迟为1s
		setTimeout(function(){
			if (success) {
				that.sendToCraft(msg);
			} else {
				that.failToCraft(msg);
			}
		}, DELAY_TIME); 

	},
	// ******************************
	// ******** 内置私有函数 ********
	// ******************************
	// 消息发往飞船成功
	sendToCraft: function(msg){ 
		// 控制对应轨道的相关活动
		window["craftNo" + msg.id].rcvCommand(msg);
	},

	// 消息发往飞船失败
	failToCraft: function(msg){
		// 操作控制台打印消息
		printer.getInfo(msg, "警告");
	}

}



// 控制台打印机构造器
function consoleTable(){
	this.array = []; // 当前控制台需要显示的消息队列 
}

consoleTable.prototype = {

	// ******************************
	// ******** 对外暴露接口 ********
	// ******************************	
	getInfo: function(msg, target){ // 传入消息 & 发送消息的对象
		var newMsg = {
			id: msg.id,
			type: msg.type,
			target: target
		}; // 构造新消息

		// 操作命令队列
		this.commandArray(newMsg);
		// 在控制台输出命令
		this.printConsole(this.array);		
	},

	// ******************************
	// ******** 内置私有函数 ********
	// ******************************
	commandArray: function(msg){
		if(this.array.length >= 7){
			this.array.shift();
		}
		this.array.push(msg);
	},

	// **********************
	// ******** view ********
	// **********************
	printConsole: function(cmdArray){	
		var consoleTemplate = Handlebars.compile($("#consoleTemplate").html()),
			content = {
				cmd: cmdArray
			};

		$("#logInfo").html(consoleTemplate(content));
	}
}


// 命令对象构造器
function message(id, type){
	this.id = id;
	this.type = type;
}


// *********** 全局对象构造 ***********
// 各飞船建立
var craftNo1 = new craft(1);
var craftNo2 = new craft(2);
var craftNo3 = new craft(3);
var craftNo4 = new craft(4);

// 构建一个指挥官
var person = new commander();

// 构建一个控制台打印机
var printer = new consoleTable();

// 构建一个介质层Mediator
var med = new mediator();


// *********** 事件绑定操作 *********** 
// 飞船单元控制按钮显示操作
$(".addBtn").on("click", function(){
	var $out = $(this).closest(".out");

	$out.find(".selected").removeClass("selected");
	// 点击增加飞船(id递增式增加)
	$out.find(".hide:first").removeClass("hide").addClass("selected");

	// selected的飞船发送create命令，创建新飞船
	var id = $out.find(".selected span.name").data("num");
		msg = new message(id, "create"); // 构建命令对象
	person.sendInfo(msg);

	// 4个飞船建满后，addBtn按钮消失
	if($out.find(".hide").length == 0){
		$(this).addClass("hide");
	}
});

// 飞船内置按钮操作
$(".innerIn").on("click", function(){

	if (!$(this).hasClass("slt")) {
		var type = $(this).data("type"), // 命令类型(start/stop/destroy)
			$craft = $(this).closest(".innerOut"), // 飞船元素
			id = $craft.find("span.name").data("num"); // 飞船id

		// 点击则本按键变灰
	 	$(this).addClass("slt");
	 	$(this).siblings().removeClass("slt");	

		var msg = new message(id, type); // 构建命令对象		

		switch (type) {
			case "start": 
				break;
			case "stop": 
				break;
			case "destroy": 
				// 删除本飞船
				$craft.addClass("hide");
				// 移除本按钮上的slt样式
				$(this).removeClass("slt");
				// addBtn按钮重现
				$(".addBtn").removeClass("hide");	
				break;	
			default:
				break;					
		}	

		// 指挥官发送消息
	 	person.sendInfo(msg);
	}
})


// Handlebars补充操作
// 参考http://www.cnblogs.com/lvdabao/p/handlebars_helper.html。Handlebars的自定义helper
Handlebars.registerHelper('compare', function(left, operator, right, options) {
	if (arguments.length < 3) {
		throw new Error('Handlerbars Helper "compare" needs 2 parameters');
	}
	var operators = {
		"==":     function(l, r) {return l == r; },
	    "===":    function(l, r) {return l === r; },
	    "!=":     function(l, r) {return l != r; },
	    "!==":    function(l, r) {return l !== r; },
	    "<":      function(l, r) {return l < r; },
	    ">":      function(l, r) {return l > r; },
	    "<=":     function(l, r) {return l <= r; },
	    ">=":     function(l, r) {return l >= r; },
	    "typeof": function(l, r) {return typeof l == r; }
	};

	if (!operators[operator]) {
		throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
	}

	var result = operators[operator](left, right);

	if (result) {
	    return options.fn(this);
	} else {
	    return options.inverse(this);
	}
});

