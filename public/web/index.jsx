const { React, ReactDOM, Arco, _ } = window;

const { Button, Cell, Switch, Image, Ellipsis, Dialog, Toast, Tag, Collapse, Progress } = Arco;

const HOST = `//${location.host}`;

const Breadcrumb = props => {
  const { dir, onChange } = props;
  const dirs = dir.split('/').slice(1);
  const handleClick = (idx) => {
    onChange('/' + dirs.slice(0, idx + 1).join('/'))
  }

  return (<section className="app-breadcrumb">
    <Button inline type="ghost" onClick={() => handleClick(dirs.length - 2)}>..</Button>
    {dirs.map((dirItem, idx) => <Button inline type="ghost" onClick={() => handleClick(idx)}>{dirItem || '/'}</Button>)}
  </section>)
}

const OutputLog = props => {
  const { curDone = 0, curPending = 0, taskId } = props;
  const [logs, setLogs] = React.useState([]);

  const handleCollapse = () => {
    // 在操作的时候，这里还是0
    if (!document.querySelector('.output-log .arco-collapse-content')?.offsetHeight === 0) {
      // close
      return;
    }

    fetch(`${HOST}/apis/op/compress`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(res => {
        const newLogs = Object.keys(res.log).map(taskId => {
          const tasks = res.log[taskId];
          const pendingTasks = tasks.filter(t => t.status === 'pending');
          const successTasks = tasks.filter(t => t.status === 'success');
          const failureTasks = tasks.filter(t => t.status === 'failure');
          return {
            taskId,
            successCount: successTasks.length,
            failureCount: failureTasks.length,
            pendingCount: pendingTasks.length,
          }
        })
        setLogs(newLogs);
      });
  }

  return (
    <section className="output-log">
      <Collapse
        header="所有日志"
        onCollapse={handleCollapse}
        content={logs.map(log => {
          const remain = log.pendingCount;
          const done = log.successCount + log.failureCount;
          return (
            <>
              <div>
                <span>[{log.taskId}]</span>
                &nbsp;
                {(new Date(parseInt(log.taskId.slice(-13))).toLocaleString())}
              </div>
              <div>成功: {log.successCount} 失败: {log.failureCount} 等待中: {log.pendingCount}</div>
              <Progress
                key={log.taskId}
                percentage={(done / (done + remain) * 100) || 0}
                renderPercent={percent => <span>{percent || 0}%&nbsp;{`${done}/${done + remain}`}</span>}
              />
            </>
          )
        })}
      />
      {taskId && curPending + curDone > 0 && (
        <Progress
          percentage={((curDone / (curDone + curPending)) * 100) || 0}
          renderPercent={percent => <span>{percent || 0}%&nbsp;{`${curDone}/${curDone + curPending}`}</span>}
          progressColor="#00b578"
          style={{ paddingLeft: '.12rem', paddingRight: '.1rem' }}
        />
      )}
    </section>
  )
}

const OutputDirectory = props => {
  const { dir, onClick } = props;

  return (
    <Button size="huge" style={{ margin: '.1rem 0' }} onClick={onClick}>{dir}</Button>
  )
}

const OutputImage = props => {
  const { name, thumb, path, size, meta, task, onTaskChange } = props;

  const [compressChecked, setCompressChecked] = React.useState(task.compress || false);
  React.useEffect(() => { setCompressChecked(task.compress) }, [task.compress]);
  const handleCheckedCompress = () => {
    setCompressChecked(!compressChecked);
    onTaskChange({[path]: { compress: !compressChecked }});
  }

  return (
    <div className="output-image">
      <Image
        height="2.18rem"
        src={`${HOST}${thumb}`}
      />
      <div className="output-display">
        <div className="display-name">{name}</div>
        <Tag className="display-tag" size="small" type="hollow">{size}</Tag>
        {meta?.compress && <Tag className="display-tag" size="small">已压缩</Tag>}
      </div>
      <Switch
        platform="ios"
        checked={compressChecked}
        onClick={handleCheckedCompress}
      />
    </div>
  )
}


const App = () => {
  const [dir, setDir] = React.useState('/');

  /* 任务区域 */
  const [taskMap, setTaskMap] = React.useState({});
  const handleImageTaskChange = (newTaskMap) => {
    setTaskMap(_.merge({}, taskMap, newTaskMap))
  }
  console.log('taskMap', taskMap)

  /* 当前log区域 */
  const [currentLog, setCurrentLog] = React.useState({ taskId: null, tasks: [] });
  const taskLog = React.useMemo(() => ({
    pendingTasks: currentLog.tasks.filter(t => t.status === 'pending'),
    successTasks: currentLog.tasks.filter(t => t.status === 'success'),
    failureTasks: currentLog.tasks.filter(t => t.status === 'failure'),
  }), [currentLog])
  function queryTask(taskId) {
    fetch(`${HOST}/apis/op/compress?taskId=${taskId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(res => {
        setCurrentLog({ taskId, tasks: res.log[taskId] })

        // done
        if (!res.log[taskId].some(t => t.status === 'pending')) {
          clearInterval(taskPoolingTimer.current)
        }
      });
  }
  const taskPoolingTimer = React.useRef(-1);
  React.useEffect(() => {
    if (!currentLog.taskId) {
      return;
    }
    taskPoolingTimer.current = setInterval(() => {
      queryTask(currentLog.taskId)
    // }, 30 * 1000);
    }, 5 * 1000);

    return () => {
      clearInterval(taskPoolingTimer.current)
    }
  }, [currentLog.taskId])
  console.log('currentLog', currentLog)


  /* 导航获取数据区域 */
  /**
   * @type {[{ dir: string[], directories: string[], images: Array<{name: string; path: string; thumb: string; meta: { compress?: boolean } }> }]}
   */
  const [data, setData] = React.useState(null);
  const getImages = destDir => {
    fetch(`${HOST}/apis/resource${destDir}`)
      .then(res => res.json())
      .then(res => {
        console.log('fetch res', destDir, res);
        setTaskMap({});
        setData(res);
      });
  }

  /* 全局操作区域 */
  const handleFilterCompress = () => {
    setData(d => ({
      ...d,
      images: d.images.filter(image => !image.meta?.compress)
    }));
    setTaskMap({})
  }
  const handleSelectALL = () => {
    const newTaskMap = data.images
      .reduce((acc, image) => ({...acc, [image.path]: { compress: true } }), {});
    
    setTaskMap(_.merge({}, taskMap, newTaskMap));
  }
  const handleSelectRevert = () => {
    const newTaskMap = data.images
      .reduce((acc, image) => ({...acc, [image.path]: { compress: !taskMap[image.path]?.compress } }), {});

    setTaskMap(_.merge({}, taskMap, newTaskMap))
  }
  const handleCompress = () => {
    // 处理需要压缩压缩的素材
    const submitTaskMap = {};
    for (let imagePath in taskMap) {
      const task = taskMap[imagePath];

      if (!task?.compress) { continue; }
      submitTaskMap[imagePath] = task;
    }
    function submitTask() {
      fetch(`${HOST}/apis/op/compress`, {
        method: 'POST',
        body: JSON.stringify(submitTaskMap),
        headers: { 'Content-Type': 'application/json' }
      })
      .then(res => res.json())
      .then(res => {
        queryTask(res.taskId);
      });
    }

    Dialog.confirm({
      title: '压缩',
      children: `确认压缩这些图片吗，共计${Object.keys(submitTaskMap).length}张素材`,
      platform: 'ios',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        if (Object.keys(submitTaskMap).length === 0) {
          return Toast.warn('暂时没有图片需要压缩');
        }
        submitTask()
      },
    })
  }

  React.useEffect(() => {
    getImages(dir);
  }, [dir]);


  if (!data) {
    return 'loading'
  }

  return (
    <div className="app">
      <Breadcrumb dir={dir} onChange={setDir} />
      <div className="app-tools">
        <Button type="primary" inline onClick={handleFilterCompress}>过滤</Button>
        <Button type="primary" inline onClick={handleSelectALL}>全选</Button>
        <Button type="primary" inline onClick={handleSelectRevert}>反选</Button>
        <Button type="default" bgColor="#FF5722" color="white" inline onClick={handleCompress}>压缩</Button>
      </div>
      <section className="app-output">
        {data.directories.length === 0 && data.images.length === 0 && <p className="output-empty">暂无数据</p>}

        <OutputLog
          taskId={currentLog.taskId}
          curPending={taskLog.pendingTasks.length}
          curDone={taskLog.successTasks.length + taskLog.failureTasks.length}
        />

        {data.directories.map(d => (<OutputDirectory dir={d} onClick={() => setDir(`${dir}${dir.endsWith('/') ? d : `/${d}`}`)} />))}

        {data.images.map(image => (<OutputImage key={image.path} {...image} task={taskMap[image.path] || {}} onTaskChange={handleImageTaskChange} />))}
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />);