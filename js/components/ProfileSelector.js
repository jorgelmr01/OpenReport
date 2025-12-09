/**
 * Profile Selector Component - UI for selecting industry profiles
 */
class ProfileSelector extends Component {
    constructor(container) {
        super(container);
        this.profileManager = window.profileManager;
        this.eventListeners = [];
        
        // Safety check
        if (!this.profileManager) {
            console.error('ProfileManager not available');
        }
    }

    render() {
        if (!this.container) return;
        
        if (!this.profileManager) {
            this.container.innerHTML = '<div class="p-2 text-red-600 text-sm">ProfileManager not available</div>';
            return;
        }
        
        const currentProfile = this.profileManager.getCurrentProfile();
        const allProfiles = this.profileManager.getAllProfiles() || [];

        this.container.innerHTML = `
            <div class="profile-selector-container">
                <select 
                    id="profileSelect" 
                    class="w-full px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                >
                    ${allProfiles.map(profile => {
                        if (!profile || !profile.id) return '';
                        const isSelected = currentProfile && currentProfile.id === profile.id;
                        return `
                            <option value="${this.escapeHtml(profile.id)}" ${isSelected ? 'selected' : ''}>
                                ${profile.icon || ''} ${this.escapeHtml(profile.name || '')}
                            </option>
                        `;
                    }).join('')}
                </select>
                ${currentProfile ? `
                    <p class="text-xs text-gray-500 mt-2">
                        ${this.escapeHtml(currentProfile.description || '')}
                    </p>
                ` : ''}
            </div>
        `;
        
        this.element = this.container;
        this.attachEventListeners();
    }
    
    escapeHtml(text) {
        if (text == null || text === undefined) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    attachEventListeners() {
        if (!this.container) return;
        
        // Clean up old listeners
        this.removeEventListeners();
        
        const element = this.element || this.container;
        const select = element.querySelector('#profileSelect');
        
        if (select && this.profileManager) {
            const changeHandler = (e) => {
                try {
                    const profileId = e.target?.value;
                    if (!profileId) return;
                    
                    if (this.profileManager.setCurrentProfile(profileId)) {
                        // Notify app of profile change
                        if (window.eventBus && typeof window.eventBus.emit === 'function') {
                            window.eventBus.emit('profileChanged', {
                                profile: this.profileManager.getCurrentProfile()
                            });
                        }
                        
                        // Show notification
                        const profile = this.profileManager.getCurrentProfile();
                        if (profile) {
                            this.showNotification(`Profile changed to: ${profile.name || profileId}`);
                        }
                        
                        // Re-render to show updated info
                        this.render();
                    }
                } catch (error) {
                    console.error('Error changing profile:', error);
                    window.NotificationService?.error(`Error changing profile: ${error.message || 'Unknown error'}`);
                }
            };
            
            select.addEventListener('change', changeHandler);
            this.eventListeners.push({ element: select, event: 'change', handler: changeHandler });
        }
    }
    
    removeEventListeners() {
        if (this.eventListeners && Array.isArray(this.eventListeners)) {
            this.eventListeners.forEach(({ element, event, handler }) => {
                if (element && typeof element.removeEventListener === 'function') {
                    element.removeEventListener(event, handler);
                }
            });
            this.eventListeners = [];
        }
    }
    
    destroy() {
        this.removeEventListeners();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }

    showNotification(message, type = 'success') {
        if (window.NotificationService) {
            window.NotificationService.show(message, type);
        } else {
            // Fallback
            const notification = document.createElement('div');
            notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            notification.textContent = message;
            document.body.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        }
    }

    getRecommendedSections() {
        try {
            if (!this.profileManager) {
                return [];
            }
            
            const profile = this.profileManager.getCurrentProfile();
            if (!profile || typeof profile.getRecommendedSections !== 'function') {
                return [];
            }
            
            return profile.getRecommendedSections() || [];
        } catch (error) {
            console.error('Error getting recommended sections:', error);
            return [];
        }
    }
}

