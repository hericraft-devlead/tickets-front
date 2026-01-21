<template>
  <div class="department-tickets">
    <!-- Header -->
    <div class="page-header department-header">
      <div class="header-left">
        <h1><span class="header-icon">👨‍💼</span> Tickets del Departamento</h1>
        <p class="subtitle">Tickets de {{ departmentName || 'Mi Departamento' }}</p>
        <div class="user-badge department-head-badge">
          <span class="badge-icon">🎯</span>
          Jefe de Departamento
        </div>
      </div>
      
      <div class="header-right">
        <div class="department-stats">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ departmentStats.total || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Sin asignar:</span>
            <span class="stat-value warning">{{ departmentStats.unassigned || 0 }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Asignados:</span>
            <span class="stat-value success">{{ departmentStats.assigned || 0 }}</span>
          </div>
        </div>
        
        <div class="header-actions">
          <button 
            @click="refreshAllData" 
            class="refresh-btn"
            :disabled="isAnyLoading"
          >
            <span v-if="isAnyLoading">🔄 Cargando...</span>
            <span v-else>🔄 Actualizar todo</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Selector de vista -->
    <div class="view-selector">
      <div class="view-tabs">
        <button 
          v-for="view in views" 
          :key="view.id"
          @click="switchView(view.id)"
          :class="{ 'active': activeView === view.id }"
          class="view-tab"
        >
          <span class="tab-icon">{{ view.icon }}</span>
          {{ view.name }}
          <span v-if="view.count !== undefined" class="tab-count">
            ({{ view.count }})
          </span>
        </button>
      </div>
    </div>

    <!-- Filtros avanzados -->
    <div class="filters-card">
      <div class="filters-header">
        <h3><span class="filter-icon">🔍</span> Filtros Avanzados</h3>
        <button 
          v-if="hasActiveFilters" 
          @click="clearFilters" 
          class="reset-filters-btn"
        >
          <span class="btn-icon">🗑️</span> Limpiar filtros
        </button>
      </div>
      
      <div class="filters-body">
        <!-- Primera fila de filtros -->
        <div class="filters-grid">
          <!-- Búsqueda -->
          <div class="filter-group">
            <label for="search">
              <span class="label-icon">🔎</span> Buscar:
            </label>
            <input 
              id="search"
              type="text" 
              v-model="search"
              @input="handleSearchInput"
              placeholder="Buscar en tickets..."
              class="search-input"
            />
          </div>
          
          <!-- Estado -->
          <div class="filter-group">
            <label for="status">
              <span class="label-icon">📊</span> Estado:
            </label>
            <select 
              id="status" 
              v-model="selectedStatus"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todos los estados</option>
              <option v-for="status in statuses" :key="status.id" :value="status.id">
                {{ status.name }}
              </option>
            </select>
          </div>
          
          <!-- Prioridad -->
          <div class="filter-group">
            <label for="priority">
              <span class="label-icon">⚠️</span> Prioridad:
            </label>
            <select 
              id="priority" 
              v-model="selectedPriority"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todas las prioridades</option>
              <option v-for="priority in priorities" :key="priority.id" :value="priority.id">
                {{ priority.name }}
              </option>
            </select>
          </div>
          
          <!-- Categoría -->
          <div class="filter-group">
            <label for="category">
              <span class="label-icon">🏷️</span> Categoría:
            </label>
            <select 
              id="category" 
              v-model="selectedCategory"
              @change="applyFilters"
              class="select-input"
            >
              <option value="">Todas las categorías</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
        </div>
        
        <!-- Segunda fila de filtros -->
        <div class="filters-grid">
          <!-- Rango de tiempo -->
          <div class="filter-group">
            <label for="timeRange">
              <span class="label-icon">📅</span> Rango de tiempo:
            </label>
            <select 
              id="timeRange" 
              v-model="selectedTimeRange"
              @change="onTimeRangeChange"
              class="select-input"
            >
              <option value="">Todo el tiempo</option>
              <option value="today">Hoy</option>
              <option value="yesterday">Ayer</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
              <option value="last_month">Mes anterior</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          <!-- Fechas personalizadas (solo visible cuando se selecciona "personalizado") -->
          <template v-if="selectedTimeRange === 'custom'">
            <div class="filter-group">
              <label>
                <span class="label-icon">📅</span> Desde:
              </label>
              <input 
                type="date" 
                v-model="customStartDate"
                @change="applyFilters"
                class="date-input"
              />
            </div>
            
            <div class="filter-group">
              <label>
                <span class="label-icon">📅</span> Hasta:
              </label>
              <input 
                type="date" 
                v-model="customEndDate"
                @change="applyFilters"
                class="date-input"
              />
            </div>
          </template>
          
          <!-- Items por página -->
          <div class="filter-group">
            <label for="per_page">
              <span class="label-icon">📄</span> Mostrar:
            </label>
            <select 
              id="per_page" 
              v-model="filters.per_page"
              @change="changePerPage"
              class="select-input"
            >
              <option value="10">10 tickets</option>
              <option value="25">25 tickets</option>
              <option value="50">50 tickets</option>
              <option value="100">100 tickets</option>
            </select>
          </div>
          
          <!-- Ordenar por -->
          <div class="filter-group">
            <label for="sortBy">
              <span class="label-icon">↕️</span> Ordenar por:
            </label>
            <select 
              id="sortBy" 
              v-model="sortBy"
              @change="handleSortChange"
              class="select-input"
            >
              <option value="created_at">Fecha creación</option>
              <option value="updated_at">Última actualización</option>
              <option value="title">Título</option>
              <option value="priority">Prioridad</option>
            </select>
            <button 
              @click="toggleSortOrder" 
              class="sort-order-btn"
              :title="sortOrder === 'asc' ? 'Orden ascendente' : 'Orden descendente'"
            >
              {{ sortOrder === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido según vista -->
    <div class="view-content">
      <!-- Vista: Todos los tickets del departamento -->
      <div v-if="activeView === 'all'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">📋</span> Todos los tickets del departamento</h3>
          <p class="section-description">
            Tickets de {{ departmentName || 'tu departamento' }} - Puedes asignarlos a miembros del equipo
          </p>
        </div>
        
        <!-- Tabla de tickets -->
        <div class="tickets-table-section">
          <div v-if="loading" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets...</p>
          </div>
          
          <div v-else-if="error" class="error-state">
            <div class="error-icon">❌</div>
            <h3>Error al cargar tickets</h3>
            <p>{{ error }}</p>
            <button @click="loadDepartmentTickets" class="btn-primary">Reintentar</button>
          </div>
          
          <div v-else-if="departmentTickets.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No hay tickets en este departamento</h3>
            <p v-if="hasActiveFilters">No hay tickets con los filtros aplicados</p>
            <p v-else>No hay tickets asignados a este departamento</p>
            <button 
              v-if="hasActiveFilters" 
              @click="clearFilters" 
              class="btn-primary"
            >
              Ver todos
            </button>
          </div>
          
          <div v-else>
            <div class="table-info">
              <span class="table-count">
                Mostrando {{ departmentTickets.length }} de {{ pagination.total }} tickets
                <span v-if="hasActiveFilters" class="filtered-badge">(Filtrados)</span>
              </span>
            </div>
            
            <div class="table-responsive">
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th @click="sortByColumn('id')" class="sortable">
                      ID
                      <span v-if="sortBy === 'id'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByColumn('title')" class="sortable">
                      Título
                      <span v-if="sortBy === 'title'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th>Usuario</th>
                    <th>Categoría</th>
                    <th @click="sortByColumn('status')" class="sortable">
                      Estado
                      <span v-if="sortBy === 'status'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th @click="sortByColumn('priority')" class="sortable">
                      Prioridad
                      <span v-if="sortBy === 'priority'" class="sort-indicator">
                        {{ sortOrder === 'asc' ? '↑' : '↓' }}
                      </span>
                    </th>
                    <th>Creado</th>
                    <th>Asignado a</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="ticket in filteredTickets" :key="ticket.id">
                    <td class="ticket-id">#{{ ticket.id }}</td>
                    <td class="ticket-title">
                      <strong>{{ ticket.title }}</strong>
                      <small class="truncated">{{ truncateText(ticket.description, 50) }}</small>
                    </td>
                    <td class="ticket-user">
                      <span v-if="ticket.moodle_user">
                        {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                      </span>
                      <span v-else class="no-user">N/A</span>
                    </td>
                    <td>{{ ticket.category?.name || 'Sin categoría' }}</td>
                    <td>
                      <span class="status-badge" :class="getStatusClass(ticket.status)">
                        {{ ticket.status?.name || 'Sin estado' }}
                      </span>
                    </td>
                    <td>
                      <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                        {{ ticket.priority?.name || 'Sin prioridad' }}
                      </span>
                    </td>
                    <td class="ticket-date">
                      <div class="date-wrapper">
                        <span class="date">{{ formatDate(ticket.created_at) }}</span>
                        <span class="time">{{ formatTime(ticket.created_at) }}</span>
                      </div>
                    </td>
                    <td class="ticket-assigned">
                      <span v-if="ticket.assigned_user" class="assigned-user">
                        {{ ticket.assigned_user.name }}
                      </span>
                      <span v-else class="unassigned-badge">
                        ⚠️ Sin asignar
                      </span>
                    </td>
                    <td class="ticket-actions">
                      <div class="action-buttons">
                        <button 
                          v-if="canManageTicket(ticket)"
                          @click="openAssignModal(ticket)"
                          class="btn-action assign"
                          :title="ticket.assigned_user ? 'Reasignar ticket' : 'Asignar ticket'"
                        >
                          {{ ticket.assigned_user ? '🔄' : '👤' }}
                        </button>
                        
                        <!-- Botón para transferir -->
                        <button 
                          v-if="canManageTicket(ticket)"
                          @click="openTransferModal(ticket)"
                          class="btn-action transfer"
                          title="Transferir a otro departamento"
                        >
                          📤
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <!-- Paginación mejorada -->
            <div v-if="pagination && pagination.last_page > 1" class="pagination">
              <div class="pagination-info">
                Página {{ filters.page }} de {{ pagination.last_page }}
              </div>
              <div class="pagination-controls">
                <button 
                  @click="prevPage"
                  :disabled="filters.page === 1"
                  class="pagination-btn prev"
                >
                  ‹ Anterior
                </button>
                
                <div class="page-numbers">
                  <button 
                    v-for="page in visiblePages"
                    :key="page"
                    @click="goToPage(page)"
                    class="page-number"
                    :class="{ active: filters.page === page }"
                    :disabled="page === '...'"
                  >
                    {{ page }}
                  </button>
                </div>
                
                <button 
                  @click="nextPage"
                  :disabled="filters.page === pagination.last_page"
                  class="pagination-btn next"
                >
                  Siguiente ›
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista: Tickets sin asignar -->
      <div v-else-if="activeView === 'unassigned'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">⚠️</span> Tickets sin asignar</h3>
          <p class="section-description">
            Tickets pendientes de asignación en {{ departmentName || 'tu departamento' }}
          </p>
        </div>
        
        <div class="unassigned-tickets-section">
          <div v-if="loadingUnassigned" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets sin asignar...</p>
          </div>
          
          <div v-else-if="unassignedTickets.length === 0" class="empty-state">
            <div class="empty-icon">🎉</div>
            <h3>¡Excelente trabajo!</h3>
            <p>Todos los tickets del departamento están asignados</p>
            <button @click="switchView('all')" class="btn-primary">
              Ver todos los tickets
            </button>
          </div>
          
          <div v-else class="tickets-grid">
            <div 
              v-for="ticket in filteredUnassignedTickets" 
              :key="ticket.id"
              class="ticket-card unassigned"
            >
              <div class="ticket-card-header">
                <span class="ticket-id">#{{ ticket.id }}</span>
                <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                  {{ ticket.priority?.name || 'Sin prioridad' }}
                </span>
                <span class="status-badge" :class="getStatusClass(ticket.status)">
                  {{ ticket.status?.name || 'Sin estado' }}
                </span>
              </div>
              
              <h4 class="ticket-title">{{ ticket.title }}</h4>
              <p class="ticket-description">{{ truncateText(ticket.description, 100) }}</p>
              
              <div class="ticket-meta">
                <span class="meta-item">
                  <strong>Categoría:</strong> {{ ticket.category?.name || 'Sin categoría' }}
                </span>
                <span class="meta-item">
                  <strong>Creado:</strong> {{ formatDate(ticket.created_at) }}
                </span>
                <span class="meta-item" v-if="ticket.moodle_user">
                  <strong>Usuario:</strong> {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                </span>
              </div>
              
              <div class="ticket-actions">
                <div class="action-buttons">
                  <button 
                    @click="openAssignModal(ticket)"
                    class="btn-action assign"
                  >
                    👤 Asignar
                  </button>
                  
                  <!-- Botón para transferir -->
                  <button 
                    @click="openTransferModal(ticket)"
                    class="btn-action transfer"
                    title="Transferir a otro departamento"
                  >
                    📤 Transferir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Vista: Tickets asignados -->
      <div v-else-if="activeView === 'assigned'" class="view-section">
        <div class="view-header">
          <h3><span class="section-icon">✅</span> Tickets asignados</h3>
          <p class="section-description">
            Tickets asignados a miembros de {{ departmentName || 'tu departamento' }}
          </p>
        </div>
        
        <div class="assigned-tickets-section">
          <div v-if="loadingAssigned" class="loading-state">
            <div class="spinner"></div>
            <p>Cargando tickets asignados...</p>
          </div>
          
          <div v-else-if="assignedTickets.length === 0" class="empty-state">
            <div class="empty-icon">📭</div>
            <h3>No hay tickets asignados</h3>
            <p>Asigna tickets a los miembros de tu equipo para verlos aquí</p>
            <button @click="switchView('unassigned')" class="btn-primary">
              Ver tickets sin asignar
            </button>
          </div>
          
          <div v-else class="assigned-list">
            <div 
              v-for="ticket in filteredAssignedTickets" 
              :key="ticket.id"
              class="assigned-ticket-card"
            >
              <div class="ticket-header">
                <div class="ticket-info">
                  <span class="ticket-id">#{{ ticket.id }}</span>
                  <h4>{{ ticket.title }}</h4>
                  <p class="ticket-description">{{ truncateText(ticket.description, 80) }}</p>
                </div>
                <div class="ticket-status">
                  <span class="status-badge" :class="getStatusClass(ticket.status)">
                    {{ ticket.status?.name || 'Sin estado' }}
                  </span>
                </div>
              </div>
              
              <div class="ticket-details">
                <div class="detail-item">
                  <strong>Prioridad:</strong>
                  <span class="priority-badge" :class="getPriorityClass(ticket.priority)">
                    {{ ticket.priority?.name || 'Sin prioridad' }}
                  </span>
                </div>
                
                <div class="detail-item">
                  <strong>Asignado a:</strong>
                  <span v-if="ticket.assigned_user" class="assigned-user">
                    {{ ticket.assigned_user.name }}
                  </span>
                  <span v-else class="unassigned-badge">Sin asignar</span>
                </div>
                
                <div class="detail-item">
                  <strong>Creado:</strong>
                  {{ formatDateTime(ticket.created_at) }}
                </div>
                
                <div class="detail-item" v-if="ticket.moodle_user">
                  <strong>Solicitante:</strong>
                  {{ ticket.moodle_user.name || ticket.moodle_user.email }}
                </div>
              </div>
              
              <div class="ticket-actions">
                <div class="action-buttons">
                  <button 
                    @click="openAssignModal(ticket)"
                    class="btn-secondary"
                  >
                    🔄 Reasignar
                  </button>
                  
                  <!-- Botón para transferir -->
                  <button 
                    @click="openTransferModal(ticket)"
                    class="btn-action transfer"
                    title="Transferir a otro departamento"
                  >
                    📤 Transferir
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de asignación/reasignación -->
    <div v-if="showAssignModal" class="modal-overlay" @click.self="closeAssignModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">{{ selectedTicket?.assigned_user ? '🔄' : '👤' }}</span>
            {{ selectedTicket?.assigned_user ? 'Reasignar' : 'Asignar' }} Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeAssignModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Previa del ticket -->
          <div class="ticket-preview">
            <h4>{{ selectedTicket?.title }}</h4>
            <p class="ticket-description">{{ selectedTicket?.description }}</p>
            <div class="ticket-info-row">
              <span class="info-label">Prioridad:</span>
              <span class="priority-badge" :class="getPriorityClass(selectedTicket?.priority)">
                {{ selectedTicket?.priority?.name || 'Sin prioridad' }}
              </span>
            </div>
            <div class="ticket-info-row">
              <span class="info-label">Categoría:</span>
              <span>{{ selectedTicket?.category?.name || 'Sin categoría' }}</span>
            </div>
            <div class="ticket-info-row" v-if="selectedTicket?.assigned_user">
              <span class="info-label">Actualmente asignado a:</span>
              <span class="current-assigned">{{ selectedTicket.assigned_user.name }}</span>
            </div>
          </div>
          
          <!-- Selección de usuario -->
          <div class="assign-section">
            <label for="assignTo">
              <span class="label-icon">👥</span>
              {{ selectedTicket?.assigned_user ? 'Reasignar a:' : 'Asignar a:' }}
            </label>
            
            <select 
              id="assignTo"
              v-model="assignToUserId"
              class="assign-select"
              :disabled="availableUsers.length === 0 || assigning"
            >
              <option value="">-- Seleccionar usuario --</option>
              <option 
                v-for="user in availableUsers" 
                :key="user.id" 
                :value="user.id"
                :disabled="user.id === selectedTicket?.assigned_user_id"
              >
                {{ user.name }} 
                <span v-if="user.role_name">({{ user.role_name }})</span>
                {{ user.id === selectedTicket?.assigned_user_id ? '(Actual)' : '' }}
              </option>
            </select>
            
            <div v-if="availableUsers.length === 0" class="warning-message">
              ⚠️ No hay usuarios disponibles en este departamento
            </div>
            
            <div v-if="loadingUsers" class="loading-small">
              Cargando usuarios...
            </div>
            
            <!-- Campo para notas -->
            <div class="assign-notes">
              <label for="assignNotes">
                <span class="label-icon">📝</span>
                Notas (opcional):
              </label>
              <textarea 
                id="assignNotes"
                v-model="assignNotes"
                class="notes-textarea"
                placeholder="Motivo de la asignación/reasignación..."
                rows="3"
                :disabled="assigning"
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button 
                @click="confirmAssignment"
                :disabled="!assignToUserId || assignToUserId === selectedTicket?.assigned_user_id || assigning"
                class="btn-primary"
              >
                <span v-if="assigning">⌛ Procesando...</span>
                <span v-else>{{ selectedTicket?.assigned_user ? '🔄 Reasignar' : '✅ Asignar' }}</span>
              </button>
              <button 
                @click="closeAssignModal" 
                class="btn-secondary"
                :disabled="assigning"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de transferencia -->
    <div v-if="showTransferModal" class="modal-overlay" @click.self="closeTransferModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>
            <span class="modal-icon">📤</span>
            Transferir Ticket #{{ selectedTicket?.id }}
          </h3>
          <button @click="closeTransferModal" class="modal-close">×</button>
        </div>
        
        <div class="modal-body">
          <!-- Previa del ticket -->
          <div class="ticket-preview">
            <h4>{{ selectedTicket?.title }}</h4>
            <p class="ticket-description">{{ selectedTicket?.description }}</p>
            <div class="ticket-info-row">
              <span class="info-label">Departamento actual:</span>
              <span class="current-department">{{ selectedTicket?.department?.name || 'Sin departamento' }}</span>
            </div>
            <div class="ticket-info-row">
              <span class="info-label">Prioridad:</span>
              <span class="priority-badge" :class="getPriorityClass(selectedTicket?.priority)">
                {{ selectedTicket?.priority?.name || 'Sin prioridad' }}
              </span>
            </div>
            <div class="ticket-info-row" v-if="selectedTicket?.assigned_user">
              <span class="info-label">Actualmente asignado a:</span>
              <span class="current-assigned">{{ selectedTicket.assigned_user.name }}</span>
            </div>
          </div>
          
          <!-- Formulario de transferencia -->
          <div class="transfer-section">
            <label for="transferDepartment">
              <span class="label-icon">🏢</span>
              Nuevo departamento:
            </label>
            
            <select 
              id="transferDepartment"
              v-model="transferDepartmentId"
              class="transfer-select"
              @change="onTransferDepartmentChange"
              :disabled="loadingDepartments || transferring"
            >
              <option value="">-- Seleccionar departamento --</option>
              <option 
                v-for="dept in departments" 
                :key="dept.id" 
                :value="dept.id"
                :disabled="dept.id === departmentId"
              >
                {{ dept.name }}
                {{ dept.id === departmentId ? '(Actual)' : '' }}
              </option>
            </select>
            
            <div v-if="loadingDepartments" class="loading-small">
              Cargando departamentos...
            </div>
            
            <div v-if="departments.length === 0" class="warning-message">
              ⚠️ No hay otros departamentos disponibles
            </div>
            
            <!-- Asignación opcional en el nuevo departamento -->
            <div v-if="transferDepartmentId && transferDepartmentId !== departmentId" class="optional-assignment">
              <label for="transferAssignTo">
                <span class="label-icon">👥</span>
                Asignar en nuevo departamento (opcional):
              </label>
              
              <select 
                id="transferAssignTo"
                v-model="transferAssignToUserId"
                class="transfer-select"
                :disabled="loadingTransferUsers || transferring"
              >
                <option value="">-- No asignar ahora --</option>
                <option 
                  v-for="user in transferDepartmentUsers" 
                  :key="user.id" 
                  :value="user.id"
                >
                  {{ user.name }} 
                  <span v-if="user.role_name">({{ user.role_name }})</span>
                </option>
              </select>
              
              <div v-if="loadingTransferUsers" class="loading-small">
                Cargando usuarios del departamento...
              </div>
              
              <div v-if="!loadingTransferUsers && transferDepartmentId && transferDepartmentUsers.length === 0" class="info-message">
                ℹ️ No hay usuarios en este departamento para asignar
              </div>
            </div>
            
            <!-- Campo para razón -->
            <div class="transfer-reason">
              <label for="transferReason">
                <span class="label-icon">📝</span>
                Razón de la transferencia:
              </label>
              <textarea 
                id="transferReason"
                v-model="transferReason"
                class="reason-textarea"
                placeholder="Motivo de la transferencia..."
                rows="3"
                :disabled="transferring"
              ></textarea>
            </div>
            
            <div class="modal-actions">
              <button 
                @click="confirmTransfer"
                :disabled="!transferDepartmentId || transferDepartmentId === departmentId || transferring"
                class="btn-primary"
              >
                <span v-if="transferring">⌛ Procesando...</span>
                <span v-else>📤 Transferir</span>
              </button>
              <button 
                @click="closeTransferModal" 
                class="btn-secondary"
                :disabled="transferring"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Notificación -->
    <div v-if="notification.show" class="notification" :class="notification.type">
      <span class="notification-icon">{{ notification.icon }}</span>
      <span class="notification-message">{{ notification.message }}</span>
      <button @click="hideNotification" class="notification-close">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useAdminAuthStore } from '@/stores/adminAuth'
import TicketService from '@/services/ticket.service.js'
import UserService from '@/services/user.service.js'
import DepartmentService from '@/services/department.service.js'
import useTicketFilters from '@/composables/useTicketFilters.js'
import departmentService from '@/services/department.service.js'

const authStore = useAdminAuthStore()

// Estados
const loading = ref(false)
const loadingUnassigned = ref(false)
const loadingAssigned = ref(false)
const loadingUsers = ref(false)
const loadingDepartments = ref(false)
const loadingTransferUsers = ref(false)
const assigning = ref(false)
const transferring = ref(false)
const error = ref(null)

// Variables para debounce
let searchTimeout = null

// Datos
const departmentTickets = ref([])
const unassignedTickets = ref([])
const assignedTickets = ref([])
const statuses = ref([])
const priorities = ref([])
const categories = ref([])
const availableUsers = ref([])
const departments = ref([])
const transferDepartmentUsers = ref([])

// Paginación
const pagination = ref(null)

// Usar el composable de filtros
const filterComposable = useTicketFilters(departmentTickets.value)
const {
  search,
  selectedStatus,
  selectedPriority,
  selectedCategory,
  selectedTimeRange,
  customStartDate,
  customEndDate,
  sortBy,
  sortOrder,
  hasActiveFilters,
  applyFilters: applyLocalFilters,
  clearFilters: clearLocalFilters,
  toggleSortOrder,
  sortByColumn
} = filterComposable

// Filtros para el backend
const activeView = ref('all')
const filters = ref({
  status: '',
  priority: '',
  category: '',
  page: 1,
  per_page: 10
})

// Asignación
const showAssignModal = ref(false)
const selectedTicket = ref(null)
const assignToUserId = ref('')
const assignNotes = ref('')

// Transferencia
const showTransferModal = ref(false)
const transferDepartmentId = ref('')
const transferAssignToUserId = ref('')
const transferReason = ref('')

// Notificaciones
const notification = ref({
  show: false,
  message: '',
  type: 'info',
  icon: 'ℹ️'
})

// Computed
const departmentId = computed(() => authStore.user?.department_id)
const departmentName = computed(() => {
  if (!authStore.user?.department) return null
  return authStore.user.department.name || `Departamento ${departmentId.value}`
})

const departmentStats = computed(() => ({
  total: pagination.value?.total || 0,
  unassigned: unassignedTickets.value.length,
  assigned: assignedTickets.value.length
}))

const views = computed(() => [
  { 
    id: 'all', 
    name: 'Todos', 
    icon: '📋',
    count: departmentStats.value.total
  },
  { 
    id: 'unassigned', 
    name: 'Sin asignar', 
    icon: '⚠️',
    count: departmentStats.value.unassigned
  },
  { 
    id: 'assigned', 
    name: 'Asignados', 
    icon: '✅',
    count: departmentStats.value.assigned
  }
])

const isAnyLoading = computed(() => {
  return loading.value || loadingUnassigned.value || loadingAssigned.value
})

const filteredTickets = computed(() => {
  return applyLocalFilters(departmentTickets.value)
})

const filteredUnassignedTickets = computed(() => {
  return applyLocalFilters(unassignedTickets.value)
})

const filteredAssignedTickets = computed(() => {
  return applyLocalFilters(assignedTickets.value)
})

const visiblePages = computed(() => {
  if (!pagination.value) return []
  const current = pagination.value.current_page
  const last = pagination.value.last_page
  const delta = 2
  const range = []
  
  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i)
  }
  
  if (current - delta > 2) {
    range.unshift('...')
  }
  if (current + delta < last - 1) {
    range.push('...')
  }
  
  range.unshift(1)
  if (last > 1) {
    range.push(last)
  }
  
  return range
})

// Inicialización
onMounted(() => {
  console.log('Vista de Jefe de Departamento cargada')
  console.log('Usuario:', authStore.user)
  console.log('Departamento ID:', departmentId.value)
  
  if (!departmentId.value) {
    error.value = 'No tienes un departamento asignado'
    showNotification(error.value, 'error', '❌')
    return
  }
  
  loadInitialData()
})

// Métodos principales
const loadInitialData = async () => {
  try {
    await Promise.all([
      loadStatuses(),
      loadPriorities(),
      loadCategories(),
      loadAvailableUsers(),
      loadDepartments(),
      refreshViewData()
    ])
  } catch (err) {
    console.error('Error cargando datos iniciales:', err)
    showNotification('Error al cargar datos del departamento', 'error', '❌')
  }
}

// Métodos de carga de datos
const loadData = async (serviceMethod, loadingRef, dataRef, params = null) => {
  loadingRef.value = true
  try {
    const response = await serviceMethod(params)
    
    // Manejar diferentes estructuras de respuesta
    if (response.data && response.data.data && Array.isArray(response.data.data)) {
      dataRef.value = response.data.data
      return response.data
    } else if (Array.isArray(response.data)) {
      dataRef.value = response.data
      return { data: response.data }
    } else if (Array.isArray(response)) {
      dataRef.value = response
      return { data: response }
    } else {
      dataRef.value = []
      return { data: [] }
    }
  } catch (err) {
    console.error('Error cargando datos:', err)
    dataRef.value = []
    return { data: [] }
  } finally {
    loadingRef.value = false
  }
}

const loadDepartmentTickets = async () => {
  const params = {
    page: filters.value.page,
    per_page: filters.value.per_page,
    department_id: departmentId.value,
    with: 'department,category,priority,status,moodle_user,assigned_user'
  }
  
  // Aplicar filtros del backend
  if (selectedStatus.value) {
    params.status_id = selectedStatus.value
  }
  
  if (selectedPriority.value) {
    params.priority_id = selectedPriority.value
  }
  
  if (selectedCategory.value) {
    params.category_id = selectedCategory.value
  }
  
  // Filtro por fecha
  if (selectedTimeRange.value) {
    const { startDate, endDate } = filterComposable.getDateRange()
    if (startDate) {
      params.start_date = startDate.toISOString().split('T')[0]
    }
    if (endDate) {
      params.end_date = endDate.toISOString().split('T')[0]
    }
  }
  
  // Filtro de búsqueda
  if (search.value.trim()) {
    params.search = search.value.trim()
  }
  
  // Ordenación
  params.sort_by = sortBy.value
  params.sort_order = sortOrder.value
  
  const response = await loadData(
    () => TicketService.getByDepartment(params),
    loading,
    departmentTickets
  )
  
  if (response.current_page) {
    pagination.value = {
      current_page: response.current_page,
      last_page: response.last_page,
      per_page: response.per_page,
      total: response.total,
      from: response.from,
      to: response.to,
      next_page_url: response.next_page_url,
      prev_page_url: response.prev_page_url
    }
  } else if (departmentTickets.value.length > 0) {
    pagination.value = {
      current_page: 1,
      last_page: 1,
      per_page: departmentTickets.value.length,
      total: departmentTickets.value.length,
      from: 1,
      to: departmentTickets.value.length
    }
  } else {
    pagination.value = null
  }
}

const loadUnassignedTickets = async () => {
  const params = {
    department_id: departmentId.value,
    with: 'department,category,priority,status,moodle_user'
  }
  
  await loadData(
    () => TicketService.getUnassignedByDepartment(params),
    loadingUnassigned,
    unassignedTickets
  )
}

const loadAssignedTickets = async () => {
  const params = {
    department_id: departmentId.value,
    with: 'department,category,priority,status,moodle_user,assigned_user'
  }
  
  await loadData(
    () => TicketService.getAssignedInDepartment(params),
    loadingAssigned,
    assignedTickets
  )
}

const loadStatuses = async () => {
  const response = await TicketService.getStatuses()
  if (Array.isArray(response.data)) {
    statuses.value = response.data
  } else if (Array.isArray(response)) {
    statuses.value = response
  } else {
    statuses.value = []
  }
}

const loadPriorities = async () => {
  const response = await TicketService.getPriorities()
  if (Array.isArray(response.data)) {
    priorities.value = response.data
  } else if (Array.isArray(response)) {
    priorities.value = response
  } else {
    priorities.value = []
  }
}

const loadCategories = async () => {
  try {
    const response = await departmentService.getAll()
    if (response.data && Array.isArray(response.data)) {
      categories.value = response.data
    } else if (Array.isArray(response)) {
      categories.value = response
    } else {
      categories.value = []
    }
  } catch (err) {
    console.error('Error cargando categorías:', err)
    categories.value = []
  }
}

const loadAvailableUsers = async () => {
  if (!departmentId.value) {
    availableUsers.value = []
    return
  }
  
  loadingUsers.value = true
  try {
    const response = await UserService.getByDepartment(departmentId.value)
    
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      availableUsers.value = response.data.users
    } else if (Array.isArray(response.data)) {
      availableUsers.value = response.data
    } else {
      availableUsers.value = []
    }
  } catch (err) {
    console.error('Error cargando usuarios del departamento:', err)
    availableUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

const loadDepartments = async () => {
  loadingDepartments.value = true
  try {
    const response = await DepartmentService.getAll()
    
    if (response.data && Array.isArray(response.data)) {
      // Filtrar el departamento actual
      departments.value = response.data.filter(dept => dept.id !== departmentId.value)
    } else if (Array.isArray(response)) {
      departments.value = response.filter(dept => dept.id !== departmentId.value)
    } else {
      departments.value = []
    }
  } catch (err) {
    console.error('Error cargando departamentos:', err)
    departments.value = []
  } finally {
    loadingDepartments.value = false
  }
}

const loadTransferDepartmentUsers = async (deptId) => {
  if (!deptId) {
    transferDepartmentUsers.value = []
    return
  }
  
  loadingTransferUsers.value = true
  try {
    const response = await UserService.getByDepartment(deptId)
    
    if (response.data && response.data.users && Array.isArray(response.data.users)) {
      transferDepartmentUsers.value = response.data.users
    } else if (Array.isArray(response.data)) {
      transferDepartmentUsers.value = response.data
    } else {
      transferDepartmentUsers.value = []
    }
  } catch (err) {
    console.error('Error cargando usuarios del departamento de transferencia:', err)
    transferDepartmentUsers.value = []
  } finally {
    loadingTransferUsers.value = false
  }
}

// Métodos de UI y navegación
const switchView = (viewId) => {
  activeView.value = viewId
}

const refreshViewData = async () => {
  console.log('Refrescando datos de la vista actual...')
  
  const promises = [loadDepartmentTickets()]
  
  switch (activeView.value) {
    case 'unassigned':
      promises.push(loadUnassignedTickets())
      break
    case 'assigned':
      promises.push(loadAssignedTickets())
      break
    case 'all':
    default:
      promises.push(loadUnassignedTickets(), loadAssignedTickets())
      break
  }
  
  return Promise.all(promises)
}

const refreshAllData = async () => {
  const loadings = [loading, loadingUnassigned, loadingAssigned]
  const activeLoading = loadings[['all', 'unassigned', 'assigned'].indexOf(activeView.value)]
  
  if (activeLoading) activeLoading.value = true
  
  try {
    await Promise.all([
      loadDepartmentTickets(),
      loadUnassignedTickets(),
      loadAssignedTickets(),
      loadAvailableUsers(),
      loadDepartments()
    ])
    showNotification('Datos actualizados correctamente', 'success', '✅')
  } catch (err) {
    console.error('Error recargando datos:', err)
    showNotification('Error al actualizar datos', 'error', '❌')
  } finally {
    loadings.forEach(loadingRef => { loadingRef.value = false })
  }
}

// Métodos de filtros y paginación
const applyFilters = () => {
  filters.value.page = 1
  loadDepartmentTickets()
}

const clearFilters = () => {
  clearLocalFilters()
  filters.value = {
    status: '',
    priority: '',
    category: '',
    page: 1,
    per_page: 10
  }
  loadDepartmentTickets()
}

// Debounce manual para búsqueda
const handleSearchInput = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    applyFilters()
  }, 500)
}

// Cambiar rango de tiempo
const onTimeRangeChange = () => {
  if (selectedTimeRange.value !== 'custom') {
    customStartDate.value = ''
    customEndDate.value = ''
  }
  applyFilters()
}

// Ordenación
const handleSortChange = () => {
  applyFilters()
}

const changePerPage = () => {
  filters.value.page = 1
  loadDepartmentTickets()
}

// Paginación
const nextPage = () => {
  if (pagination.value && filters.value.page < pagination.value.last_page) {
    filters.value.page++
    loadDepartmentTickets()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevPage = () => {
  if (pagination.value && filters.value.page > 1) {
    filters.value.page--
    loadDepartmentTickets()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const goToPage = (page) => {
  if (page !== '...') {
    filters.value.page = page
    loadDepartmentTickets()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Métodos de tickets
const canManageTicket = (ticket) => {
  return ticket.department_id === departmentId.value
}

// Modal de asignación
const openAssignModal = async (ticket) => {
  if (!canManageTicket(ticket)) {
    showNotification('No puedes asignar tickets de otros departamentos', 'error', '❌')
    return
  }
  
  selectedTicket.value = ticket
  assignToUserId.value = ticket.assigned_user_id || ''
  assignNotes.value = ''
  
  if (availableUsers.value.length === 0) {
    await loadAvailableUsers()
  }
  
  showAssignModal.value = true
}

const confirmAssignment = async () => {
  if (!selectedTicket.value || !assignToUserId.value) return
  
  assigning.value = true
  
  try {
    const assignmentData = {
      ticketId: selectedTicket.value.id,
      userId: assignToUserId.value,
      notes: assignNotes.value || `Asignado por ${authStore.user?.name || 'Jefe de Departamento'}`
    }
    
    if (selectedTicket.value.assigned_user) {
      await TicketService.reassign(assignmentData.ticketId, assignmentData.userId, assignmentData.notes)
      showNotification(`Ticket #${selectedTicket.value.id} reasignado correctamente`, 'success', '✅')
    } else {
      await TicketService.assign(assignmentData.ticketId, assignmentData.userId, assignmentData.notes)
      showNotification(`Ticket #${selectedTicket.value.id} asignado correctamente`, 'success', '✅')
    }
    
    // Actualizar datos después de asignación exitosa
    await updateTicketAfterAssignment(selectedTicket.value.id, assignToUserId.value)
    
    closeAssignModal()
    await refreshViewData()
    
  } catch (err) {
    console.error('Error asignando/reasignando ticket:', err)
    
    // Mostrar error solo si realmente falló
    const message = err.response?.data?.message || 'Error al procesar la asignación'
    showNotification(message, 'error', '❌')
  } finally {
    assigning.value = false
  }
}

// Modal de transferencia
const openTransferModal = async (ticket) => {
  if (!canManageTicket(ticket)) {
    showNotification('No puedes transferir tickets de otros departamentos', 'error', '❌')
    return
  }
  
  selectedTicket.value = ticket
  transferDepartmentId.value = ''
  transferAssignToUserId.value = ''
  transferReason.value = ''
  transferDepartmentUsers.value = []
  
  // Cargar departamentos si no están cargados
  if (departments.value.length === 0) {
    await loadDepartments()
  }
  
  if (departments.value.length === 0) {
    showNotification('No hay otros departamentos disponibles para transferir', 'warning', '⚠️')
    return
  }
  
  showTransferModal.value = true
}

const onTransferDepartmentChange = async () => {
  if (!transferDepartmentId.value || transferDepartmentId.value === departmentId.value) {
    transferDepartmentUsers.value = []
    transferAssignToUserId.value = ''
    return
  }
  
  // Cargar usuarios del nuevo departamento
  await loadTransferDepartmentUsers(transferDepartmentId.value)
}

const confirmTransfer = async () => {
  if (!selectedTicket.value || !transferDepartmentId.value || transferDepartmentId.value === departmentId.value) return
  
  transferring.value = true
  
  try {
    // Mostrar confirmación
    const deptName = departments.value.find(d => d.id === transferDepartmentId.value)?.name || 'el nuevo departamento'
    if (!confirm(`¿Estás seguro de transferir el ticket a ${deptName}?`)) {
      transferring.value = false
      return
    }
    
    // Transferir el ticket
    const transferData = {
      ticketId: selectedTicket.value.id,
      departmentId: transferDepartmentId.value,
      reason: transferReason.value || `Transferido por ${authStore.user?.name || 'Jefe de Departamento'}`
    }
    
    await TicketService.transfer(transferData.ticketId, transferData.departmentId, transferData.reason)
    
    // Si se seleccionó un usuario, asignarlo también
    if (transferAssignToUserId.value) {
      const assignNotes = `Ticket transferido de ${selectedTicket.value.department?.name || 'departamento anterior'} y asignado`
      await TicketService.assign(transferData.ticketId, transferAssignToUserId.value, assignNotes)
    }
    
    showNotification(`Ticket #${selectedTicket.value.id} transferido correctamente`, 'success', '✅')
    
    // Cerrar modal y recargar datos
    closeTransferModal()
    await refreshViewData()
    
  } catch (err) {
    console.error('Error transfiriendo ticket:', err)
    
    // Mostrar error solo si realmente falló
    const message = err.response?.data?.message || 'Error al procesar la transferencia'
    showNotification(message, 'error', '❌')
  } finally {
    transferring.value = false
  }
}

const updateTicketAfterAssignment = (ticketId, newUserId) => {
  const assignedUser = availableUsers.value.find(user => user.id === newUserId)
  
  // Actualizar en departmentTickets
  const ticketIndex = departmentTickets.value.findIndex(t => t.id === ticketId)
  if (ticketIndex !== -1) {
    departmentTickets.value[ticketIndex].assigned_user = assignedUser
    departmentTickets.value[ticketIndex].assigned_user_id = newUserId
  }
  
  // Actualizar en unassignedTickets
  const unassignedIndex = unassignedTickets.value.findIndex(t => t.id === ticketId)
  if (unassignedIndex !== -1) {
    unassignedTickets.value.splice(unassignedIndex, 1)
  }
  
  // Actualizar en assignedTickets
  if (assignedUser) {
    const assignedIndex = assignedTickets.value.findIndex(t => t.id === ticketId)
    if (assignedIndex !== -1) {
      assignedTickets.value[assignedIndex].assigned_user = assignedUser
    } else {
      const ticketToAdd = departmentTickets.value.find(t => t.id === ticketId)
      if (ticketToAdd) {
        assignedTickets.value.push(ticketToAdd)
      }
    }
  }
  
  // Forzar reactividad
  departmentTickets.value = [...departmentTickets.value]
  unassignedTickets.value = [...unassignedTickets.value]
  assignedTickets.value = [...assignedTickets.value]
}

const closeAssignModal = () => {
  showAssignModal.value = false
  selectedTicket.value = null
  assignToUserId.value = ''
  assignNotes.value = ''
}

const closeTransferModal = () => {
  showTransferModal.value = false
  selectedTicket.value = null
  transferDepartmentId.value = ''
  transferAssignToUserId.value = ''
  transferReason.value = ''
  transferDepartmentUsers.value = []
}

// Utilidades
const truncateText = (text, length) => {
  if (!text) return ''
  return text.length > length ? text.substring(0, length) + '...' : text
}

const getStatusClass = (status) => {
  if (!status?.name) return 'unknown'
  const statusName = status.name.toLowerCase()
  if (statusName.includes('abierto') || statusName.includes('pendiente')) return 'pending'
  if (statusName.includes('progreso')) return 'in-progress'
  if (statusName.includes('resuelto') || statusName.includes('cerrado')) return 'resolved'
  return 'unknown'
}

const getPriorityClass = (priority) => {
  if (!priority?.name) return 'medium'
  const priorityName = priority.name.toLowerCase()
  if (priorityName.includes('baja')) return 'low'
  if (priorityName.includes('media')) return 'medium'
  if (priorityName.includes('alta')) return 'high'
  if (priorityName.includes('urgente')) return 'urgent'
  return 'medium'
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  } catch {
    return dateString
  }
}

const formatTime = (dateString) => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return ''
  }
}

const formatDateTime = (dateString) => {
  if (!dateString) return ''
  try {
    return new Date(dateString).toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

// Notificaciones
const showNotification = (message, type = 'info', icon = 'ℹ️') => {
  notification.value = {
    show: true,
    message,
    type,
    icon
  }
  
  setTimeout(hideNotification, 3000)
}

const hideNotification = () => {
  notification.value.show = false
}

// Watchers
watch(() => filters.value.per_page, () => {
  if (!loading.value) {
    applyFilters()
  }
})
</script>

<style scoped>
/* Estilos para la vista de departamento */
.department-tickets {
  padding: 1.5rem;
}

/* Header */
.department-header {
  background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%);
  border-radius: 0.75rem;
  padding: 1.5rem 2rem;
  color: white;
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.header-left h1 {
  margin: 0;
  font-size: 1.875rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.subtitle {
  margin: 0.5rem 0;
  opacity: 0.9;
}

.department-head-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-top: 0.5rem;
}

.department-stats {
  display: flex;
  gap: 1.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.75rem 1.25rem;
  border-radius: 0.75rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

.stat-value {
  font-weight: bold;
  font-size: 1.25rem;
}

.stat-value.warning {
  color: #fbbf24;
}

.stat-value.success {
  color: #34d399;
}

.refresh-btn {
  background: white;
  color: #0ea5e9;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Selector de vistas */
.view-selector {
  background: white;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-tabs {
  display: flex;
  border-bottom: 1px solid #e5e7eb;
}

.view-tab {
  flex: 1;
  padding: 1rem 1.5rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  font-weight: 500;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.view-tab:hover {
  background: #f9fafb;
  color: #374151;
}

.view-tab.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
  background: #eff6ff;
}

.tab-count {
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  margin-left: 0.25rem;
}

.view-tab.active .tab-count {
  background: #3b82f6;
  color: white;
}

/* Filtros avanzados */
.filters-card {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.filters-header h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #374151;
}

.reset-filters-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.reset-filters-btn:hover {
  background: #e5e7eb;
}

.filters-body {
  border-top: 1px solid #e5e7eb;
  padding-top: 1.5rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-group label {
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.select-input,
.search-input,
.date-input {
  padding: 0.625rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: border-color 0.2s;
  background: white;
  cursor: pointer;
  width: 100%;
}

.select-input:focus,
.search-input:focus,
.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sort-order-btn {
  background: none;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  margin-left: 0.5rem;
  transition: all 0.2s;
}

.sort-order-btn:hover {
  background: #f3f4f6;
}

/* Contenido */
.view-content {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.view-section {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.view-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.section-description {
  color: #6b7280;
  margin-top: 0.5rem;
}

/* Tabla */
.tickets-table-section {
  margin-top: 1.5rem;
}

.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 3rem;
}

.spinner {
  border: 3px solid #f3f4f6;
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.table-info {
  margin-bottom: 1rem;
  padding: 0.5rem 0;
}

.table-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.filtered-badge {
  background: #e0e7ff;
  color: #3730a3;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
}

.table-responsive {
  overflow-x: auto;
}

.tickets-table {
  width: 100%;
  border-collapse: collapse;
}

.tickets-table th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
  white-space: nowrap;
}

.tickets-table td {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.tickets-table tr:hover {
  background: #f9fafb;
}

/* Encabezados ordenables */
.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 1.5rem !important;
}

.sortable:hover {
  background: #f0f9ff;
}

.sort-indicator {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.875rem;
  color: #3b82f6;
}

.ticket-id {
  font-weight: bold;
  color: #374151;
}

.ticket-title {
  max-width: 300px;
}

.truncated {
  display: block;
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.ticket-date {
  white-space: nowrap;
  color: #6b7280;
}

.date-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.date {
  font-size: 0.875rem;
  color: #111827;
}

.time {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Badges */
.status-badge,
.priority-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.in-progress {
  background: #dbeafe;
  color: #1e40af;
}

.status-badge.resolved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.unknown {
  background: #f3f4f6;
  color: #6b7280;
}

.priority-badge.low {
  background: #d1fae5;
  color: #065f46;
}

.priority-badge.medium {
  background: #fef3c7;
  color: #92400e;
}

.priority-badge.high {
  background: #fde68a;
  color: #92400e;
}

.priority-badge.urgent {
  background: #fecaca;
  color: #991b1b;
}

.unassigned-badge {
  color: #f59e0b;
  font-weight: 500;
}

.assigned-user {
  color: #10b981;
  font-weight: 500;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

/* Paginación mejorada */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.pagination-info {
  color: #6b7280;
  font-size: 0.875rem;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #374151;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
  margin: 0 0.5rem;
}

.page-number {
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  background: white;
  cursor: pointer;
  font-size: 0.875rem;
  min-width: 2.5rem;
}

.page-number:hover:not(.active):not(:disabled) {
  background: #f3f4f6;
}

.page-number.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.page-number:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Tickets sin asignar */
.tickets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.ticket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s;
}

.ticket-card.unassigned {
  border-left: 4px solid #f59e0b;
}

.ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ticket-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.ticket-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item {
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
}

.ticket-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-primary, .btn-secondary, .btn-success {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  flex: 1;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-secondary {
  background: #9ca3af;
  color: white;
}

.btn-success {
  background: #10b981;
  color: white;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
}

.modal-body {
  padding: 1.5rem;
}

.ticket-preview {
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.ticket-info-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.assign-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assign-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
}

.modal-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

/* Notificación */
.notification {
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease-out;
  z-index: 1000;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification.success {
  background: #10b981;
  color: white;
}

.notification.error {
  background: #ef4444;
  color: white;
}

.notification.info {
  background: #3b82f6;
  color: white;
}

.notification-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  cursor: pointer;
  margin-left: auto;
  opacity: 0.8;
}

.notification-close:hover {
  opacity: 1;
}

/* Estilos para tickets asignados */
.assigned-tickets-section {
  margin-top: 1rem;
}

.assigned-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.assigned-ticket-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s;
  border-left: 4px solid #10b981;
}

.assigned-ticket-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.ticket-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.ticket-info {
  flex: 1;
}

.ticket-info h4 {
  margin: 0.5rem 0;
  color: #374151;
  font-size: 1.125rem;
}

.ticket-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0.5rem 0;
  line-height: 1.4;
}

.ticket-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.detail-item strong {
  color: #374151;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .department-header {
    flex-direction: column;
  }
  
  .department-stats {
    width: 100%;
    justify-content: space-around;
  }
  
  .view-tabs {
    flex-direction: column;
  }
  
  .filters-grid {
    grid-template-columns: 1fr;
  }
  
  .tickets-grid {
    grid-template-columns: 1fr;
  }
  
  .pagination {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }
  
  .pagination-controls {
    justify-content: center;
  }
}
.ticket-actions .action-buttons {
  display: flex;
  gap: 0.25rem;
  flex-wrap: nowrap;
}

.btn-action {
  padding: 0.375rem;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
}

.btn-action.assign {
  background: #d1fae5;
  color: #065f46;
}

.btn-action.assign:hover {
  background: #a7f3d0;
}

.btn-action.transfer {
  background: #e0e7ff;
  color: #3730a3;
}

.btn-action.transfer:hover {
  background: #c7d2fe;
}

/* Modal de transferencia */
.transfer-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 1.5rem;
}

.transfer-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  width: 100%;
}

.optional-assignment {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.info-message {
  padding: 0.5rem;
  color: #6b7280;
  background: #f3f4f6;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  text-align: center;
}

.transfer-reason {
  margin-top: 1rem;
}

.reason-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 80px;
}

.reason-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Botones en tarjetas */
.ticket-actions .action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.ticket-actions .btn-action {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
  min-width: auto;
  height: auto;
}

.ticket-actions .btn-action.transfer {
  background: #e0e7ff;
  color: #3730a3;
  border: 1px solid #c7d2fe;
}

.ticket-actions .btn-action.transfer:hover {
  background: #c7d2fe;
}

/* Estilos para la tabla */
.tickets-table td.ticket-actions {
  white-space: nowrap;
}

.tickets-table td.ticket-actions .action-buttons {
  display: flex;
  gap: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .ticket-actions .action-buttons {
    flex-direction: column;
  }
  
  .tickets-table td.ticket-actions .action-buttons {
    flex-direction: row;
    justify-content: center;
  }
  
  .ticket-actions .btn-action {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .tickets-table td.ticket-actions .action-buttons {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .btn-action {
    width: 100%;
  }
}
</style>