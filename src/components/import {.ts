import {
    Avatar,
    Badge,
    Col,
    ConfigProvider,
    Flex,
    FloatButton,
    Input,
    Row,
    Splitter,
    Tag,
    Tooltip,
    message,
    notification,
    theme,
} from 'antd';
import { BsDatabaseFillX, BsEye, BsPencilSquare, BsPlusSquare } from 'react-icons/bs';
import {
    EVENT_HANDLERS,
} from './utils/builderUtils';
import { FaUser, FaUsers } from 'react-icons/fa';
import { HiZoomIn, HiZoomOut } from 'react-icons/hi';
import { KeepScale, MiniMap, TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import Moveable, { MoveableManagerInterface } from 'react-moveable';
import { PiCursorFill, PiPencilDuotone } from 'react-icons/pi';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RedoOutlined, UndoOutlined } from '@mui/icons-material';
import SchemaERD, { sampleTables } from './ERDViewer';
import _, { isEmpty } from 'lodash';
import { addCommentReply, deleteComment, getComments, resolveComment, storeComment, updateComment } from '@/services/comments';
import { getScaleValue, getTopOffset } from './utils/scale';
// import { initializeControlBoxPositioning, updateControlBoxPosition } from './Moveable/ControlBoxDynoPosition';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { BiSolidCommentAdd } from 'react-icons/bi';
import { CiViewTimeline } from 'react-icons/ci';
import DOMFlowDiagram from './DOMDiagram';
import DividerComponent from '../componentLibrary/DividerComponent';
import DrawPathComponent from '../componentLibrary/DrawComponent';
import ElementRenderer from './RenderElements';
import { ErrorBoundary } from 'react-error-boundary';
import { FloatingComment } from './Comments/commentEditor';
import { GroupManager } from '@moveable/helper';
import { IconRenderer } from '../componentLibrary/IconSelector';
import ImageDropzone from './DraggingAndDropping/ImageDropZone';
import InlineEditText from './InLineTextEditor';
import LayersPanel from './LayersPanel';
import { MdCenterFocusStrong } from 'react-icons/md';
import ReactJson from 'react-json-view';
import RightMenu from './BuilderSections/MiddleBuilderSection/Canvas/RightMenu/RighMenu';
import { RootState } from '@reduxjs/toolkit/query';
import Selecto from 'react-selecto';
import { UserOutlined } from '@ant-design/icons';
import WorkflowViewer from '../Backend/AiWorkflowGenerator';
import { deepFlat } from '@daybrush/utils';
import { flattenStyleObject } from '@/utils/flattenStyleObject';
// import { getPosition, getPosition2 } from '@/utils/getPosition';
import { processController } from '../components/Views/digest/digester';
import { retrieveBody } from '../components/Views/digest/state/utils';
import { updateObjectById } from './utils/updateComponentByIdInArray';
import useDrawing from '../Mail/componentLibrary/DrawComponent/Util/useDraw';
import useWebSocketPresence from './userWebsocket';
import { BuilderProps } from './Interfaces/BuilderPropsInterface';
import { Element } from './Interfaces/ElementInterface';
import { MiddleBuilderSection } from './BuilderSections/MiddleBuilderSection';
import { LeftBuilderSection } from './BuilderSections/LeftBuilderSection';
import { initializeControlBoxPositioning } from './BuilderSections/MiddleBuilderSection/Canvas/Moveable/moveableCalcUtil';
import { useUndoRedo } from './utils/history';
import { fetchCommentsData } from './Comments/util';
import { useComponentRenderer } from './BuilderSections/MiddleBuilderSection/Canvas/Moveable/moveableUtils';
import { getComponentDimensionsSimple } from '@/utils/getComponentDimensions';

// import { Badge } from 'rizzui';
// import FigmaLikeEditor from './fabric';

export const Builder: React.FC<BuilderProps> = ({
    application,
    items = [],
    allComponents,
    onItemEdit,
    allComponentsRaw,
    setItemToEdit,
    handleSaveLayout,
    Editor,
    parentStyle,
    setCreateViewDialogIsOpen,
    parentConfig,
    itemToEdit,
    loading,
    domInspectorOpen,
    editMode,
    setEditMode,
}) => {
    delete parentStyle?.position;

    const [isDrawingPathActive, setIsDrawingPathActive] = useState(false);
    const [activeDrawingPathId, setActiveDrawingPathId] = useState(null);
    const [builderCursorMode, setBuilderCursorMode] = useState<'default' | 'hand' | 'draw' | 'path'>('default');
    const [isDragging, setIsDragging] = useState(false);
    // const [isResizing, setIsResizing] = useState(false);
    const { tab, setting, id } = useParams();
    const groupManager = useMemo(() => new GroupManager([]), []);
    const [targets, setTargets] = useState([]);
    const [PanelSizes, setPanelSizes] = useState<(number | string)[]>(['8%', '70%', '15%']);
    const [scale, setScale] = useState(40);
    const appState = useSelector((state) => state.appState);
    // const { currentId, instanceId, width, instanceName, height, mediaType, mediaExtension } = useSelector((state: DragAndDropState) => state.dragAndDrop);
    const containerRef = useRef(null);
    const containerRef2 = useRef(null);
    const user = useSelector((state) => state.auth.user);
    const [elements, setElements] = useState<Element[]>(items || []);
    const { push, undo, redo, canUndo, canRedo, reset } = useUndoRedo(elements);
    const [isFocused, setIsFocused] = useState(false);
    const [isBuilderActive, setIsBuilderActive] = useState(false);
    const [comments, setComments] = useState<Document[]>([]);
    const [refreshData, setrefreshData] = useState<any>();
    const [messages, setMessages] = useState<string[]>([]);
    const selectoRef = useRef(null);
    // const [groups, setGroups] = useState({});
    // const [scale, setScale] = useState(initialDimensions.scale);
    const [currentDragPoint, setCurrentDragPoint] = useState({});
    // const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [placeholderPos, setPlaceholderPos] = useState({ x: 0, y: 0, });
    // const [commentPos, setCommentPos] = useState(null);
    const [draggingElement, setDraggingElement] = useState(null);
    const dispatch = useDispatch();
    const transformRef = React.useRef(null);
    const currentUser = { name: 'kyda', id: 'kj', };
    const { activeUsers, sendMessage, connectionState } = useWebSocketPresence(user, tab, containerRef2);
    const params = useParams();
    const currentApplication = useSelector((state) => state.currentAppState.currentApplication);
    // const urlParams = new URLSearchParams(window.location.search);
    const navigate = useNavigate();

    // Draw Variables
    const {
        selectedPath,
        setSelectedPath,
        showControls,
        setShowControls,
        setDraggingHandle,
    } = useDrawing(scale, containerRef, setElements);

    const ScaleContainer = ({
        designWidth = 1440,
        designHeight = 900,
        children,
        className = '',
        maxScale = 5,
        style,
        minScale = 0.3,
    }) => {
        // Use useCallback for the scale calculation function
        const calculateDimensions = useCallback(() => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const scaleX = viewportWidth / designWidth;
            const scaleY = viewportHeight / designHeight;
            let newScale = Math.min(scaleX, scaleY);
            newScale = Math.min(Math.max(newScale, minScale), maxScale);

            const scaledWidth = designWidth * newScale;
            const scaledHeight = designHeight * newScale;

            const x = (viewportWidth - scaledWidth) / 2;
            const y = (viewportHeight - scaledHeight) / 2;

            return { scale: newScale, position: { x, y } };
        }, [designWidth, designHeight, maxScale, minScale]);

        // Use useMemo for the initial calculation
        const initialDimensions = useMemo(() => calculateDimensions(), [calculateDimensions]);
        const [position, setPosition] = useState(initialDimensions.position);

        // Memoize the style object to prevent unnecessary recalculations
        const containerStyle = useMemo(
            () => ({
                ...style,
                width: `${designWidth}px`,
                height: `${designHeight}px`,
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: '0 0',
            }),
            [style, designWidth, designHeight, position.x, position.y, scale]
        );

        return (
            <div className= "fixed inset-0 overflow-hidden" >
            <div className={ `absolute ${className}` } style = { containerStyle } >
                { children }
                </div>
                </div>
    );
  };

const ResponsiveContainer = ({
    aspectRatio = '16/9',
    maxWidth = '100%',
    minWidth = '300px',
    className = '',
    children,
}) => {
    return (
        <div className= "w-full flex justify-center" >
        <div
          className={ `relative w-full ${className}` }
    style = {{
        maxWidth,
            minWidth,
          }
}
        >
    <div
            className="w-full"
style = {{
    paddingTop: `calc(100% / (${aspectRatio}))`,
            }}
          />
    < div className = "absolute inset-0" > { children } </div>
        </div>
        </div>
    );
  };

const componentsMap = useMemo(() => {
    return allComponents?.reduce((map, component) => {
        if (component?.value) {
            map[component.value] = component.config?.component;
        }
        return map;
    }, {});
}, [allComponents]);

const setSelectedTargets = useCallback(
    (nextTargets) => {
        selectoRef.current?.setSelectedTargets(deepFlat(nextTargets));
        setTargets(nextTargets);
    },
    [isDrawingPathActive]
);

const handleDelete = () => {
    if (targets.length === 0) {
        // message.error('no items');
        return;
    }
    const targetIds = targets.map((target) => target.id);
    const deleteElements = (elements, idsToDelete) => {
        return elements.filter((element) => {
            if (idsToDelete.includes(element.i)) return false;
            return true;
        });
    };
    setElements((prevElements) => {
        const newElements = deleteElements(prevElements, targetIds);
        targetIds.forEach((id) => {
            onItemEdit?.('delete', {
                i: id,
            });
        });
        setSelectedTargets([]);
        setTargets([]);
        return newElements;
    });
    setTargets([]);
};

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return;
            }
            seen.add(value);
        }
        return value;
    };
};

const createEventHandler = (e, processToRun, elementId) => {
    // message.success(elementId);
    // console.log
    return processController(
        processToRun || [],
        e || {},
        id,
        navigate,
        params,
        'eventHandler',
        elementId,
        (process) =>
            notification.open({
                className: '',
                placement: 'bottomLeft',
                duration: 0,
                type: 'info',
                message: `${process.name} ${new Date().toDateString()}`,
                description: (
                    <div className= "h-[200px] w-[300px] overflow-auto" >
                    <ReactJson
                enableClipboard
                depth={ 2}
                collapseStringsAfterLength={ 25}
                displayArrayKey={ false}
                quotesOnKeys={ false}
                src={
                  {
                    ...JSON.parse(JSON.stringify(process, getCircularReplacer())),
                    localStore: JSON.parse(localStorage.getItem(id + '-' + 'sessionInfo') || '{}'),
                } || {}
                }
collapsed = { 3}
    />
    </div>
          ),
        }),
tab,
    () => ''
    );
  };

const createEventHandlers = (item, data) => {
    // console.log(data, item);
    // message.warning(item.i);
    const handlers = {};

    Object.keys(EVENT_HANDLERS).forEach((eventName) => {
        console.log(item?.configuration?.[eventName], item);
        if (!item?.configuration?.[eventName] || item?.configuration?.[eventName]?.plugins?.length === 0) return;
        const configHandler = item?.configuration?.[eventName];
        console.log(configHandler?.plugins);
        if (!isEmpty(configHandler)) {
            handlers[eventName] = (e) => {
                return createEventHandler(e, configHandler, item.i);
            };
        }
    });
    return handlers;
};

const FormSkeleton = () => {
    return (
        <div className= "grid grid-cols-2 gap-4 p-2" >
        {/* First row - full width header */ }
        < div className = "col-span-2 animate-pulse" >
            <div className="bg-neutral-800 rounded-md h-4" />
                </div>

    {/* Generate 22 skeleton items in 2 columns */ }
    {
        Array.from({ length: 50 }).map((_, index) => (
            <div key= { index } className = "animate-pulse" >
            <div className="bg-neutral-800 rounded-md h-5" />
        </div>
        ))
    }
    </div>
    );
  };

const renderComponent = useComponentRenderer({
    scale,
    editMode,
    containerRef,
    itemToEdit,
    setElements,
    setItemToEdit,
    componentsMap,
    selectedPath,
    showControls,
    setSelectedPath,
    setShowControls,
    activeDrawingPathId,
    isDrawingPathActive,
    setActiveDrawingPathId,
    setDraggingHandle
});

const handleElementChange = (newElements: Element[]) => {
    setElements(newElements);
    push(newElements);
};

useEffect(() => {
    if (targets?.length === 1) {
        if (setItemToEdit.i === targets[0]?.id) return;
        const el = elements?.find((item) => item.i === targets[0]?.id);
        setItemToEdit(el);
    } else {
        setItemToEdit({});
    }
}, [targets]);

useEffect(() => {
    if (true) {
        fetchCommentsData(tab, setComments);
    }
}, [tab, refreshData]);

useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
        // Check if click is inside builder
        if (containerRef.current?.contains(e.target as Node)) {
            setIsBuilderActive(true);
        } else {
            setIsBuilderActive(false);
        }
    };

    // Handle clicks outside to deactivate builder
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
        document.removeEventListener('mousedown', handleMouseDown);
    };
}, []);

useEffect(() => {
    setTimeout(() => {
        reset();
    }, 50);
}, [tab]);

useEffect(() => {
    handleElementChange(elements);
    handleSaveLayout(elements);
}, [elements]);

useEffect(() => {
    const isDifferent = items.some((item) => {
        const matchingElement = elements.find((element) => element.i === item.i);
        return !matchingElement || JSON.stringify(matchingElement) !== JSON.stringify(item);
    });
    if (true) {
        handleElementChange(items);
        setElements(items);
    }
}, [items]);

useEffect(() => {
    const elements = selectoRef.current?.getSelectableElements();
    groupManager.set([], elements);
}, []);

useEffect(() => {
    const cleanup = initializeControlBoxPositioning();
    return cleanup;
}, []);

useEffect(() => {
    if (!isFocused) {
        return;
    }
    const handleKeyDown = (event) => {
        if (event.ctrlKey && event.code === 'Backslash') {
            if (JSON.stringify(PanelSizes) === JSON.stringify(['0%', '100%', '0%'])) {
                setPanelSizes(['8%', '70%', '15%']);
            } else {
                setPanelSizes(['0%', '100%', '0%']);
            }
        }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
    };
}, [PanelSizes]);

useEffect(() => {
    setTargets([]);
    setSelectedTargets([]);
    reset();
}, [tab]);

useEffect(() => {
    const timer = setTimeout(() => {
        if (transformRef.current) {
            transformRef.current.centerView();
        }
    }, 100);
    return () => clearTimeout(timer);
}, []);

useEffect(() => {
    setTimeout(() => {
        if (transformRef.current) {
            transformRef.current.centerView();
        }
        setScale(40);
    }, 100);
}, [currentApplication?.views?.find((view) => view.id === tab)?.configuration?.deviceScreen?.size]);

useEffect(() => {
    // Add throttling to improve performance
    let lastUpdateTime = 0;
    const throttleThreshold = 50; // ms

    const handleMouseMoveContainer = (e) => {
        // Simple throttling to avoid excessive calculations
        const now = Date.now();
        if (now - lastUpdateTime < throttleThreshold) return;
        lastUpdateTime = now;

        if (!containerRef.current) return;

        // Get the container's bounding rectangle
        const containerRect = containerRef.current.getBoundingClientRect();

        // Get the scale factor as a decimal
        const scaleRatio = scale / 100;

        // When scale < 100%, the visual area is larger than the DOM element's bounds
        // Calculate the center point (origin of scaling)
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const containerCenterY = containerRect.top + containerRect.height / 2;

        // Calculate the actual visual dimensions (inverse of scaling)
        const visualWidth = containerRect.width / scaleRatio;
        const visualHeight = containerRect.height / scaleRatio;

        // Calculate the visual boundaries
        const visualLeft = containerCenterX - (visualWidth / 2);
        const visualRight = containerCenterX + (visualWidth / 2);
        const visualTop = containerCenterY - (visualHeight / 2);
        const visualBottom = containerCenterY + (visualHeight / 2);

        // Check if mouse is within the visual boundaries
        const isInside =
            e.clientX >= visualLeft &&
            e.clientX <= visualRight &&
            e.clientY >= visualTop &&
            e.clientY <= visualBottom;

        // Update state without showing a notification on every move
        // setIsDroppingInContainerBounds(isInside);
        // isInside ? message.info("inside") : message.info("outside")
    };

    document.addEventListener('mousemove', handleMouseMoveContainer);

    return () => {
        document.removeEventListener('mousemove', handleMouseMoveContainer);
    };
}, [containerRef, scale]);

useEffect(() => {
    console.log(activeUsers)
}, [activeUsers])

return (
    <div
    // onReset={() => { }}
    // onError={() => { message.error('Error on builder'); }}
    >
    {/* <FigmaLikeEditor /> */ }
      {/* <SchemaERD tables={sampleTables} /> */ }
{/* <WorkflowViewer /> */ }
{
    editMode ? (
        <>
        { editMode && (
            <div className= "servly-builder-screens-tab relative w-full h-8 bg-neutral-900 p-0.5 flex border-r border-neutral-800" >
        <div className="w-full flex overflow-auto overflow-visible" >
            <button
                  className={
        `
                    px-3 py-1 text-xs flex items-center gap-1.5 transition-all duration-200
                    border-r border-neutral-700 last:border-r-0
                    'text-neutral-500 hover:text-white hover:bg-zinc-700/50'
                  `}
    onClick = {() => {
        setCreateViewDialogIsOpen(true);
    }
}
                >
    <BsPlusSquare color="green" size = { 14} />
        <span className="truncate" > New Page </span>
            </button>

{
    currentApplication?.views?.map((tabb) => (
        <div className= "relative" key = { tabb.id } >
        <button
                      className={`
                        px-3 py-1 text-xs flex items-center gap-1.5 transition-all duration-200
                        border-r border-neutral-700 last:border-r-0
                        ${tab === tabb.id
            ? 'bg-[#1e1e1e] text-white font-medium'
            : 'text-neutral-500 hover:text-white hover:bg-zinc-700/50'
        }
                      `}
onClick = {() => {
    navigate(`/applications/${id}/${setting}/${tabb.id}`);
}}
                    >
    <CiViewTimeline size={ 14 } />
        < span className = "truncate" > { tabb.name } </span>
            </button>

{
    activeUsers?.filter((usser) => usser.page === tabb.id)?.length > 0 && (
        <div
                        className="absolute -top-2 right-1 flex items-center gap-0.5 z-[2147483647]"
    style = {{ pointerEvents: 'none' }
}
                      >
    <div className="flex -space-x-2 overflow-visible" >
        {
            activeUsers
                            ?.filter((usser) => usser.page === tabb.id)
                            ?.slice(0, 3)
    ?.map((user, index) => (
        <div
                                key= { user.id || index }
                                className = "w-4 h-4 rounded-full border-2 border-neutral-900 bg-gray-300 flex items-center justify-center overflow-hidden"
                                style = {{ zIndex: 2147483647 - index }}
                              >
        {
            user.avatar ? (
                <img src= { user.avatar } alt={ user.name || 'User' } className="w-full h-full object-cover" />
                                ) : (
    <FaUser className= "w-3 h-3 text-neutral-700" color = { user.color } />
                                )}
</div>
                            ))}
</div>

{/* <div className="bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center justify-center min-w-[18px] h-4">
                          <FaUsers className="w-2 h-2 mr-0.5" />
                          {activeUsers?.filter((usser) => usser.page === tabb.id)?.length}
                        </div> */}
</div>
                    )}
</div>
                ))}
</div>
    </div>
          )}
<div
            className={
    `servly-builder-entry 
              flex bg-neutral-900 ov border-t border-neutral-700 ${builderCursorMode === 'hand'
        ? 'cursor-grab active:cursor-grabbing'
        : builderCursorMode === 'draw'
            ? '!cursor-draw'
            : builderCursorMode === 'path'
                ? 'cursor-path'
                : builderCursorMode === 'comment'
                    ? 'cursor-comment'
                    : ''
    }`
}
style = {{
    height: `calc(100vh - ${getComponentDimensionsSimple('.view-builder-header')?.height}px - ${getComponentDimensionsSimple('.servly-builder-screens-tab')?.height}px)`
}}
          >
    <Splitter
              onResize={
    (e) => {
        setPanelSizes(e);
    }
}
            >

{/* <ul className="user-list">
                {activeUsers.length}
                {activeUsers
                  .filter((userr) => userr.page === tab)
                  .map((userr) => (
                    <li key={userr._id} className="user-item">
                      <span className="user-status-indicator"></span>
                      <span className="user-name">{JSON.stringify(userr, null, 2)}</span>
                      {userr.userId === user._id && <span> (you)</span>}
                    </li>
                  ))}
              </ul> */}

{
    editMode && (
        // Builder Left Section: Info, Layers, State
        <Splitter.Panel min="14%" max = "22%" size = { '16%'} className = "builder-left-panel h-fill  " >
            <LeftBuilderSection
                    currentApplication={ currentApplication }
    application = { application }
    tab = { tab }
    activeUsers = { activeUsers?.filter((user) => user.page === tab)
}
elements = { elements }
targets = { targets }
setIsFocused = { setIsFocused }
allComponentsRaw = { allComponentsRaw }
setSelectedTargets = { setSelectedTargets }
setElements = { setElements }
setTargets = { setTargets }
handleDelete = { handleDelete }
updateObjectById = { updateObjectById }
    />
    </Splitter.Panel>
              )}

{/* Builder Middle Section: Canvas, DOM Inspector */ }
<Splitter.Panel className="overflow-hdidden" >
    <MiddleBuilderSection

                  // Objects
                  activeUsers={ activeUsers }
allComponentsRaw = { allComponentsRaw }
appState = { appState }
componentsMap = { componentsMap }
currentApplication = { currentApplication }
elements = { elements }
groupManager = { groupManager }
parentConfig = { parentConfig }
parentStyle = { parentStyle }
targets = { targets }
user = { user }

// Functions
createEventHandlers = { createEventHandlers }
flattenStyleObject = { flattenStyleObject }
handleDelete = { handleDelete }
sendMessage = { sendMessage }
setActiveDrawingPathId = { setActiveDrawingPathId }
setBuilderCursorMode = { setBuilderCursorMode }
setEditMode = { setEditMode }
setElements = { setElements }
setIsFocused = { setIsFocused }
setIsDrawingPathActive = { setIsDrawingPathActive }
setItemToEdit = { setItemToEdit }
setScale = { setScale }
setSelectedTargets = { setSelectedTargets }
setTargets = { setTargets }
setIsDragging = { setIsDragging }
setDraggingElement = { setDraggingElement }

// Booleans
domInspectorOpen = { domInspectorOpen }
editMode = { editMode }
isBuilderActive = { isBuilderActive }
isDragging = { isDragging }
isDrawingPathActive = { isDrawingPathActive }

// Strings
activeDrawingPathId = { activeDrawingPathId }
builderCursorMode = { builderCursorMode }
selectedPath = { selectedPath }
tab = { tab }

// Numbers
scale = { scale }

// Refs
containerRef = { containerRef }
containerRef2 = { containerRef2 }
itemToEdit = { itemToEdit }
selectoRef = { selectoRef }
transformRef = { transformRef }
    />
    </Splitter.Panel>

{/* Builder Right Section: Style Editor, Controllers */ }
{
    editMode && (
        <Splitter.Panel min="20%" max = "28%" size = { '22%'} className = " overflow-auto" >
            <div
                    className=""
    onClick = {() => {
        setIsFocused(false);
        // setSelectedTargets([]);
        // setTargets([]);
    }
}
                  >
    { _.isEmpty(currentApplication) ? FormSkeleton() : Editor }
    </div>
    </Splitter.Panel>
              )}

</Splitter>
    </div>
    </>
      ) : (
    <div
          style= {{ width: '100vw', height: '100vh', overflowY: 'scroll', ...parentStyle }}
        >
    <ElementRenderer
            targets={ targets }
elements = { elements }
readOnly = { false}
tab = { tab }
navigate = { navigate }
appState = { appState }
parentId = { null}
editMode = { editMode }
isDrawingPathActive = { isDrawingPathActive }
setIsDrawingPathActive = { setIsDrawingPathActive }
activeDrawingPathId = { activeDrawingPathId }
setActiveDrawingPathId = { setActiveDrawingPathId }
setSelectedElements = { setSelectedTargets }
isDragging = { isDragging }
flattenStyleObject = { flattenStyleObject }
createEventHandlers = { createEventHandlers }
renderComponent = { renderComponent }
currentApplication = { currentApplication }
builderCursorMode = { builderCursorMode }
    />
    </div>
      )}
<>
    {!editMode && (
        <FloatButton
            shape="square"
type = "primary"
style = {{
    insetInlineEnd: 24,
            }}
icon = {< PiPencilDuotone />}
onClick = {(e) => {
    e.preventDefault();
    setEditMode(true);
    setSelectedTargets([]);
    setScale(40);
    setTimeout(() => {
        transformRef.current.centerView();
    }, 50);
    // setScale(40);
}}
          />
        )}
</>
    </div>
  );
};